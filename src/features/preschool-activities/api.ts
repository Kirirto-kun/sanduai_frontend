import {
  GENERATION_JOBS_UPDATED_EVENT,
  getToken,
  validateGenerationJobAcknowledgement,
  type GenerationJob,
} from "@/lib/api";
import { getApiBase } from "@/lib/api-base";
import { decodeJwtPayload } from "@/lib/auth-token";
import { ApiRequestError, fetchWithPolicy, readResponsePayload, requestJson } from "@/lib/http-client";
import { withIdempotencyKey } from "@/lib/idempotency";
import { invalidateCachedBalance } from "@/lib/tokenCache";
import {
  attachPreschoolIntent,
  clearPreschoolIntent,
  clearPreschoolIntentForJob,
  isPreschoolJobActive,
  preschoolIntent,
  preschoolRequestFingerprint,
  retryablePreschoolRequest,
} from "./recovery";
import type {
  PreschoolActivityDocument,
  PreschoolActivityInput,
  PreschoolActivitySummary,
  PreschoolAdminSettings,
  PreschoolAdminSettingsUpdate,
  PreschoolConfig,
  PreschoolTaskAction,
} from "./types";

export const PRESCHOOL_JOB_KINDS = {
  generate: "preschool_activity.generate",
  topics: "preschool_activity.topics",
  task: "preschool_activity.task",
} as const;

type Options = {
  paid?: boolean;
  expectedStatuses?: readonly number[];
  idempotencyKey?: string;
  timeoutMs?: number;
  signal?: AbortSignal;
};

async function request<T>(path: string, method = "GET", payload?: unknown, options: Options = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers({ "Content-Type": "application/json" });
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return requestJson<T>(`${getApiBase()}${path}`, {
    method,
    headers: options.paid ? withIdempotencyKey(headers, options.idempotencyKey) : headers,
    body: payload === undefined ? undefined : JSON.stringify(payload),
    signal: options.signal,
    cache: "no-store",
  }, {
    timeoutMs: options.timeoutMs ?? 30_000,
    expectedStatuses: options.expectedStatuses,
  });
}

async function pause(milliseconds: number): Promise<void> {
  await new Promise((resolve) => globalThis.setTimeout(resolve, milliseconds));
}

const enqueueing = new Map<string, Promise<GenerationJob>>();

function currentSessionUserId(): string | null {
  const token = getToken();
  const subject = token ? decodeJwtPayload(token)?.sub : null;
  return typeof subject === "string" && subject ? subject : null;
}

class PreschoolSessionChangedError extends ApiRequestError {
  constructor() {
    super("The account changed while submitting this material.", 403, { detail: { code: "AUTH_SESSION_CHANGED" } });
  }
}

function assertOwner(ownerId: string | null): void {
  if (currentSessionUserId() !== ownerId) throw new PreschoolSessionChangedError();
}

async function enqueue(path: string, payload: unknown, kind: string): Promise<GenerationJob> {
  const ownerId = currentSessionUserId();
  const fingerprint = preschoolRequestFingerprint(path, payload);
  const requestKey = JSON.stringify([ownerId, fingerprint]);
  const existing = enqueueing.get(requestKey);
  if (existing) return existing;

  const operation = (async () => {
    let intent = preschoolIntent(ownerId, fingerprint);
    if (intent.jobId) {
      try {
        assertOwner(ownerId);
        const response = await request<GenerationJob>(`/api/v1/generations/${encodeURIComponent(intent.jobId)}`);
        assertOwner(ownerId);
        const known = validateGenerationJobAcknowledgement(response, kind);
        if (isPreschoolJobActive(known.status)) return known;
        clearPreschoolIntent(ownerId, fingerprint);
        intent = preschoolIntent(ownerId, fingerprint);
      } catch (error) {
        // A deleted/expired job allows an intentional new action. A lost read
        // acknowledgement must keep the existing key and server reservation.
        if (error instanceof ApiRequestError && error.status === 404) {
          clearPreschoolIntent(ownerId, fingerprint);
          intent = preschoolIntent(ownerId, fingerprint);
        } else if (!retryablePreschoolRequest(error)) {
          throw error;
        }
      }
    }
    let lastError: unknown;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      assertOwner(ownerId);
      try {
        const result = await request<GenerationJob>(path, "POST", payload, {
          paid: true,
          idempotencyKey: intent.key,
          expectedStatuses: [202],
          timeoutMs: 20_000,
        });
        assertOwner(ownerId);
        const job = validateGenerationJobAcknowledgement(result, kind);
        attachPreschoolIntent(ownerId, fingerprint, job.id);
        invalidateCachedBalance();
        if (typeof window !== "undefined") window.dispatchEvent(new Event(GENERATION_JOBS_UPDATED_EVENT));
        return job;
      } catch (error) {
        lastError = error;
        if (!retryablePreschoolRequest(error)) {
          if (error instanceof ApiRequestError && !(error instanceof PreschoolSessionChangedError) && [400, 401, 402, 403, 404, 409, 422].includes(error.status)) {
            clearPreschoolIntent(ownerId, fingerprint);
          }
          throw error;
        }
        if (attempt === 2) throw error;
        await pause(400 * (2 ** attempt));
      }
    }
    throw lastError;
  })();
  enqueueing.set(requestKey, operation);
  try { return await operation; } finally {
    if (enqueueing.get(requestKey) === operation) enqueueing.delete(requestKey);
  }
}

export const preschoolActivityApi = {
  config: () => request<PreschoolConfig>("/api/preschool-activities/config"),
  list: (offset = 0) => request<{ items: PreschoolActivitySummary[]; total: number }>(
    `/api/preschool-activities?limit=30&offset=${Math.max(0, Math.trunc(offset))}`,
  ),
  get: (id: string) => request<PreschoolActivityDocument>(`/api/preschool-activities/${encodeURIComponent(id)}`),
  generate: (input: PreschoolActivityInput) => enqueue(
    "/api/preschool-activities/generate",
    input,
    PRESCHOOL_JOB_KINDS.generate,
  ),
  topics: (payload: Pick<PreschoolActivityInput, "group_id" | "age" | "activity_type" | "language" | "goal"> & { season?: string }) => enqueue(
    "/api/preschool-activities/topics",
    payload,
    PRESCHOOL_JOB_KINDS.topics,
  ),
  transformTask: (
    documentId: string,
    taskId: string,
    expectedVersion: number,
    action: PreschoolTaskAction,
    instructions = "",
  ) => enqueue(
    `/api/preschool-activities/${encodeURIComponent(documentId)}/tasks/${encodeURIComponent(taskId)}/transform`,
    { expected_version: expectedVersion, action, instructions: instructions.trim() || undefined },
    PRESCHOOL_JOB_KINDS.task,
  ),
  async job(id: string, signal?: AbortSignal): Promise<GenerationJob> {
    const ownerId = currentSessionUserId();
    const job = await request<GenerationJob>(`/api/v1/generations/${encodeURIComponent(id)}`, "GET", undefined, { timeoutMs: 15_000, signal });
    assertOwner(ownerId);
    if (!isPreschoolJobActive(job.status)) clearPreschoolIntentForJob(ownerId, id);
    return job;
  },
  adminSettings: () => request<PreschoolAdminSettings>("/api/admin/preschool-activities/settings"),
  updateAdminSettings: (settings: PreschoolAdminSettingsUpdate) => request<PreschoolAdminSettings>("/api/admin/preschool-activities/settings", "PUT", settings),
  remove: (id: string) => request<void>(`/api/preschool-activities/${encodeURIComponent(id)}`, "DELETE", undefined, { expectedStatuses: [200, 204] }),
  async export(id: string, format: "docx" | "pdf"): Promise<Blob> {
    const token = getToken();
    const response = await fetchWithPolicy(
      `${getApiBase()}/api/preschool-activities/${encodeURIComponent(id)}/export?format=${format}`,
      { headers: token ? { Authorization: `Bearer ${token}` } : undefined, cache: "no-store" },
      { timeoutMs: 120_000 },
    );
    if (!response.ok) {
      const { data } = await readResponsePayload(response);
      throw new ApiRequestError("Unable to export preschool activity", response.status, data);
    }
    return response.blob();
  },
};
