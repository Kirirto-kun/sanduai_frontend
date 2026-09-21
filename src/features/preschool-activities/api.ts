import {
  GENERATION_JOBS_UPDATED_EVENT,
  getToken,
  validateGenerationJobAcknowledgement,
  type GenerationJob,
} from "@/lib/api";
import { getApiBase } from "@/lib/api-base";
import { ApiRequestError, fetchWithPolicy, readResponsePayload, requestJson } from "@/lib/http-client";
import { createIdempotencyKey, withIdempotencyKey } from "@/lib/idempotency";
import { invalidateCachedBalance } from "@/lib/tokenCache";
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

function retryable(error: unknown): boolean {
  return error instanceof ApiRequestError && (
    error.status === 0 || error.status === 408 || error.status === 425 || error.status === 429 || error.status >= 500
  );
}

async function pause(milliseconds: number): Promise<void> {
  await new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

async function enqueue(path: string, payload: unknown, kind: string): Promise<GenerationJob> {
  const key = createIdempotencyKey();
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const result = await request<GenerationJob>(path, "POST", payload, {
        paid: true,
        idempotencyKey: key,
        expectedStatuses: [202],
        timeoutMs: 20_000,
      });
      const job = validateGenerationJobAcknowledgement(result, kind);
      invalidateCachedBalance();
      window.dispatchEvent(new Event(GENERATION_JOBS_UPDATED_EVENT));
      return job;
    } catch (error) {
      lastError = error;
      if (!retryable(error) || attempt === 2) throw error;
      await pause(400 * (2 ** attempt));
    }
  }
  throw lastError;
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
  job: (id: string, signal?: AbortSignal) => request<GenerationJob>(
    `/api/v1/generations/${encodeURIComponent(id)}`,
    "GET",
    undefined,
    { timeoutMs: 15_000, signal },
  ),
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
