import {
  getToken,
  GENERATION_JOBS_UPDATED_EVENT,
  validateGenerationJobAcknowledgement,
  type GenerationJob,
} from "../../lib/api";
import { getApiBase } from "../../lib/api-base";
import {
  ApiRequestError,
  fetchWithPolicy,
  readResponsePayload,
  requestJson,
} from "../../lib/http-client";
import { createIdempotencyKey, withIdempotencyKey } from "../../lib/idempotency";
import { invalidateCachedBalance } from "../../lib/tokenCache";
import type {
  CellAction,
  CellChange,
  CyclogramAdminConfig,
  CyclogramAdminUpdate,
  CyclogramConfig,
  CyclogramDocument,
  CyclogramInput,
  CyclogramSummary,
} from "./types";

export const CYCLOGRAM_JOB_KINDS = {
  generate: "cyclogram.generate",
  topics: "cyclogram.topics",
  cell: "cyclogram.cell",
} as const;

type RequestOptions = {
  paid?: boolean;
  signal?: AbortSignal;
  expectedStatuses?: readonly number[];
  idempotencyKey?: string;
  timeoutMs?: number;
};

export function cyclogramRequest<T>(
  path: string,
  method = "GET",
  payload?: unknown,
  options: RequestOptions = {},
): Promise<T> {
  const token = getToken();
  const headers = new Headers({ "Content-Type": "application/json" });
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return requestJson<T>(`${getApiBase()}${path}`, {
    method,
    headers: options.paid
      ? withIdempotencyKey(headers, options.idempotencyKey)
      : headers,
    body: payload === undefined ? undefined : JSON.stringify(payload),
    signal: options.signal,
    cache: "no-store",
  }, {
    timeoutMs: options.timeoutMs ?? 30_000,
    expectedStatuses: options.expectedStatuses,
  });
}

const INTENTS_KEY = "sanduai:cyclogram:intents:v1";
type CyclogramIntent = { key: string; createdAt: number; jobId?: string };

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => `${JSON.stringify(key)}:${canonicalJson(entry)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value) ?? "null";
}

function fingerprint(path: string, payload: unknown): string {
  const source = `${path}:${canonicalJson(payload)}`;
  let hash = 2166136261;
  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `${path}:${(hash >>> 0).toString(16)}:${source.length}`;
}

function readIntents(): Record<string, CyclogramIntent> {
  if (typeof window === "undefined") return {};
  try {
    const parsed = JSON.parse(window.localStorage.getItem(INTENTS_KEY) ?? "{}") as Record<string, CyclogramIntent>;
    const cutoff = Date.now() - 24 * 60 * 60 * 1_000;
    return Object.fromEntries(Object.entries(parsed).filter(([, intent]) =>
      intent && typeof intent.key === "string" && intent.createdAt >= cutoff,
    ));
  } catch {
    return {};
  }
}

function writeIntents(intents: Record<string, CyclogramIntent>): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(INTENTS_KEY, JSON.stringify(intents));
  } catch {
    // Server-side idempotency remains authoritative if browser storage is full.
  }
}

function intentFor(path: string, payload: unknown): { fingerprint: string; intent: CyclogramIntent } {
  const intentFingerprint = fingerprint(path, payload);
  const intents = readIntents();
  const existing = intents[intentFingerprint];
  if (existing) return { fingerprint: intentFingerprint, intent: existing };
  const intent = { key: createIdempotencyKey(), createdAt: Date.now() };
  intents[intentFingerprint] = intent;
  writeIntents(intents);
  return { fingerprint: intentFingerprint, intent };
}

function attachJob(intentFingerprint: string, jobId: string): void {
  const intents = readIntents();
  const intent = intents[intentFingerprint];
  if (!intent) return;
  intents[intentFingerprint] = { ...intent, jobId };
  writeIntents(intents);
}

export function clearCyclogramIntentForJob(jobId: string): void {
  const intents = readIntents();
  const next = Object.fromEntries(Object.entries(intents).filter(([, intent]) => intent.jobId !== jobId));
  if (Object.keys(next).length !== Object.keys(intents).length) writeIntents(next);
}

function retryable(error: unknown): boolean {
  return error instanceof ApiRequestError && (
    error.status === 0 ||
    error.status === 408 ||
    error.status === 425 ||
    error.status === 429 ||
    error.status >= 500
  );
}

function wait(milliseconds: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

async function enqueue(
  path: string,
  payload: unknown,
  expectedKind: string,
): Promise<GenerationJob> {
  const { fingerprint: intentFingerprint, intent } = intentFor(path, payload);
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const value = await cyclogramRequest<GenerationJob>(path, "POST", payload, {
        paid: true,
        idempotencyKey: intent.key,
        expectedStatuses: [202],
        timeoutMs: 20_000,
      });
      const job = validateGenerationJobAcknowledgement(value, expectedKind);
      attachJob(intentFingerprint, job.id);
      invalidateCachedBalance();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event(GENERATION_JOBS_UPDATED_EVENT));
      }
      return job;
    } catch (error) {
      lastError = error;
      if (!retryable(error) || attempt === 2) throw error;
      await wait(400 * (2 ** attempt));
    }
  }
  throw lastError;
}

async function uploadWordTemplate(file: File): Promise<CyclogramAdminConfig> {
  const token = getToken();
  const form = new FormData();
  form.append("file", file);
  const response = await fetchWithPolicy(`${getApiBase()}/api/admin/cyclograms/word-template`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: form,
    cache: "no-store",
  }, { timeoutMs: 120_000 });
  const { data } = await readResponsePayload(response);
  if (!response.ok) throw new ApiRequestError("Unable to upload Word template", response.status, data);
  if (!data || typeof data !== "object") throw new ApiRequestError("Invalid Word template response", 502, data);
  return data as CyclogramAdminConfig;
}

export const cyclogramApi = {
  config: () => cyclogramRequest<CyclogramConfig>("/api/cyclograms/config"),
  list: (offset = 0) => cyclogramRequest<{ items: CyclogramSummary[]; total: number }>(`/api/cyclograms?limit=30&offset=${Math.max(0, offset)}`),
  get: (id: string) => cyclogramRequest<CyclogramDocument>(`/api/cyclograms/${encodeURIComponent(id)}`),
  generate: (input: CyclogramInput) => enqueue("/api/cyclograms/generate", input, CYCLOGRAM_JOB_KINDS.generate),
  topics: (input: Pick<CyclogramInput, "age" | "group_id" | "language" | "week_start">) => enqueue("/api/cyclograms/topics", input, CYCLOGRAM_JOB_KINDS.topics),
  save: (id: string, version: number, cells: CellChange[]) => cyclogramRequest<CyclogramDocument>(`/api/cyclograms/${encodeURIComponent(id)}`, "PATCH", { expected_version: version, cells }),
  cell: (id: string, version: number, section_id: string, day_index: number, action: CellAction) => enqueue(`/api/cyclograms/${encodeURIComponent(id)}/cells`, { expected_version: version, section_id, day_index, action }, CYCLOGRAM_JOB_KINDS.cell),
  job: (id: string, signal?: AbortSignal) => cyclogramRequest<GenerationJob>(`/api/v1/generations/${encodeURIComponent(id)}`, "GET", undefined, { signal, timeoutMs: 15_000 }),
  adminConfig: () => cyclogramRequest<CyclogramAdminConfig>("/api/admin/cyclograms/config"),
  updateAdminConfig: (config: CyclogramAdminUpdate) => cyclogramRequest<CyclogramAdminConfig>("/api/admin/cyclograms/config", "PUT", config),
  uploadWordTemplate,
  async export(id: string, format: "docx" | "pdf"): Promise<Blob> {
    const token = getToken();
    const response = await fetchWithPolicy(`${getApiBase()}/api/cyclograms/${encodeURIComponent(id)}/export?format=${format}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      cache: "no-store",
    }, { timeoutMs: 120_000 });
    if (!response.ok) {
      const { data } = await readResponsePayload(response);
      throw new ApiRequestError("Unable to export document", response.status, data);
    }
    return response.blob();
  },
};
