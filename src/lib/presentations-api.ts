import { getToken } from "./api";
import { getApiBase } from "./api-base";
import { decodeJwtPayload } from "./auth-token";
import { isTerminalPresentationJob } from "./presentation-recovery";
import {
  API_ERROR_CODES,
  ApiRequestError,
  apiErrorCodeForStatus,
  fetchWithPolicy,
  readResponsePayload,
  requestJson,
  type ApiErrorCode,
  type ApiFailure,
} from "./http-client";
import type {
  CostEstimate,
  CreateExportInput,
  CreatePresentationInput,
  JobEvent,
  JobRef,
  JobState,
  PlanJobInput,
  PresentationExport,
  PresentationCapabilities,
  PresentationListResponse,
  PresentationPlan,
  PresentationProject,
  SavedKmzhSourceList,
  SlideSpec,
  UpdatePlanInput,
} from "@/types/presentations";

const API_BASE = getApiBase();
const PREFIX = "/api/v2/presentations";

export class PresentationApiError extends ApiRequestError {
  public readonly serverCode?: string;
  public readonly retryAfterSeconds?: number;

  constructor(
    message: string,
    status: number,
    serverCode?: string,
    details?: unknown,
    stableCode: ApiErrorCode = apiErrorCodeForStatus(status),
    retryAfterSeconds?: number,
  ) {
    super(message, status, details, stableCode);
    this.name = "PresentationApiError";
    this.serverCode = serverCode;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

function idempotencyKey() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

const INTENTS_KEY = "sanduai_presentation_intents_v1";
type PresentationIntent = { key: string; owner: string; createdAt: number; jobId?: string };
const memoryIntents = new Map<string, PresentationIntent>();
const writesInFlight = new Map<string, Promise<unknown>>();

function currentOwner(): string {
  const token = getToken();
  const owner = token ? decodeJwtPayload(token)?.sub : undefined;
  return typeof owner === "string" && owner ? owner : "anonymous";
}

function readIntents(): Record<string, PresentationIntent> {
  try {
    const stored: unknown = typeof window === "undefined" ? {} : JSON.parse(window.localStorage.getItem(INTENTS_KEY) ?? "{}");
    if (!stored || typeof stored !== "object" || Array.isArray(stored)) return {};
    return Object.fromEntries(Object.entries(stored).filter(([, value]) => {
      const intent = value as Partial<PresentationIntent> | null;
      return intent && typeof intent.key === "string" && typeof intent.owner === "string"
        && typeof intent.createdAt === "number" && intent.createdAt <= Date.now()
        && intent.createdAt > Date.now() - 24 * 60 * 60 * 1000;
    }));
  } catch { return {}; }
}

function storeIntent(fingerprint: string, intent?: PresentationIntent) {
  if (intent) memoryIntents.set(fingerprint, intent);
  else memoryIntents.delete(fingerprint);
  if (typeof window === "undefined") return;
  try {
    const stored = readIntents();
    if (intent && intent.owner !== "anonymous") stored[fingerprint] = intent;
    else delete stored[fingerprint];
    window.localStorage.setItem(INTENTS_KEY, JSON.stringify(stored));
  } catch { /* The same identity remains available in memory when storage is full. */ }
}

async function writeIdentity(path: string, init: RequestInit): Promise<{ fingerprint: string; intent: PresentationIntent }> {
  const owner = currentOwner();
  // Persist only a digest and request identity, never the teacher's source text.
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${owner}:${init.method}:${path}:${String(init.body ?? "")}`));
  const fingerprint = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
  const old = readIntents()[fingerprint] ?? memoryIntents.get(fingerprint);
  const intent = old?.owner === owner && old.createdAt > Date.now() - 24 * 60 * 60 * 1000
    ? old : { key: idempotencyKey(), owner, createdAt: Date.now() };
  storeIntent(fingerprint, intent);
  return { fingerprint, intent };
}

function settleJobIdentity(jobId: string) {
  const owner = currentOwner();
  const all = { ...Object.fromEntries(memoryIntents), ...readIntents() };
  for (const [fingerprint, intent] of Object.entries(all)) {
    if (intent.owner === owner && intent.jobId === jobId) storeIntent(fingerprint);
  }
}

function presentationError(failure: ApiFailure): PresentationApiError {
  const payload = failure.details && typeof failure.details === "object"
    ? failure.details as { detail?: unknown; message?: string; code?: string }
    : null;
  const detail = payload?.detail;
  const structuredDetail = detail && typeof detail === "object" && !Array.isArray(detail)
    ? detail as { message?: unknown; code?: unknown; retry_after_seconds?: unknown }
    : null;
  if (payload) {
    const validationMessage = Array.isArray(detail)
      ? detail
          .map((item) => {
            if (!item || typeof item !== "object") return String(item);
            const entry = item as { loc?: unknown[]; msg?: unknown };
            const field = Array.isArray(entry.loc)
              ? entry.loc.filter((part) => part !== "body").join(" → ")
              : "";
            const message = typeof entry.msg === "string" ? entry.msg : "Invalid value";
            return field ? `${field}: ${message}` : message;
          })
          .join("; ")
      : undefined;
    const message =
      (typeof structuredDetail?.message === "string" ? structuredDetail.message : undefined) ??
      payload?.message ??
      (typeof detail === "string" ? detail : undefined) ??
      validationMessage ??
      failure.message;
    const serverCode = typeof structuredDetail?.code === "string"
      ? structuredDetail.code
      : payload.code;
    const bodyRetry = structuredDetail?.retry_after_seconds;
    const retryAfterSeconds = failure.retryAfterSeconds ?? (
      typeof bodyRetry === "number" && Number.isFinite(bodyRetry) && bodyRetry >= 0 ? bodyRetry : undefined
    );
    return new PresentationApiError(
      message,
      failure.status,
      serverCode,
      structuredDetail ?? detail ?? payload,
      failure.code,
      retryAfterSeconds,
    );
  }

  return new PresentationApiError(
    failure.message,
    failure.status,
    undefined,
    failure.details,
    failure.code,
    failure.retryAfterSeconds,
  );
}

async function parseError(response: Response): Promise<PresentationApiError> {
  const payload = await readResponsePayload(response);
  return presentationError({
    message:
      typeof payload.data === "string" && payload.data.trim()
        ? payload.data
        : `Request failed: ${response.status}`,
    status: response.status,
    code: apiErrorCodeForStatus(response.status),
    details: payload.data,
  });
}

async function request<T>(
  path: string,
  options: RequestInit & {
    idempotent?: boolean;
    expectedStatuses?: readonly number[];
    timeoutMs?: number;
  } = {},
): Promise<T> {
  const { idempotent, expectedStatuses, timeoutMs, ...requestInit } = options;
  const token = getToken();
  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type") && options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  headers.set("Accept", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const identity = idempotent && expectedStatuses?.includes(202) ? await writeIdentity(path, requestInit) : null;
  if (identity) {
    if (currentOwner() !== identity.intent.owner) throw new PresentationApiError("The account changed.", 403);
    const inFlight = writesInFlight.get(identity.fingerprint);
    if (inFlight) return inFlight as Promise<T>;
  }
  if (idempotent) headers.set("Idempotency-Key", identity?.intent.key ?? idempotencyKey());

  const result = requestJson<T>(`${API_BASE}${path}`, {
    ...requestInit,
    headers,
    cache: "no-store",
  }, {
    errorFactory: presentationError,
    expectedStatuses,
    timeoutMs,
  });
  if (!identity) return result;
  const tracked = result.then(payload => {
    if (currentOwner() !== identity.intent.owner) throw new PresentationApiError("The account changed.", 403);
    const value = payload as { job_id?: unknown } | null;
    if (typeof value?.job_id === "string" && PRESENTATION_JOB_ID_PATTERN.test(value.job_id)) {
      storeIntent(identity.fingerprint, { ...identity.intent, jobId: value.job_id });
    }
    return payload;
  }).finally(() => writesInFlight.delete(identity.fingerprint));
  writesInFlight.set(identity.fingerprint, tracked);
  return tracked;
}

function unwrapProject(payload: unknown): PresentationProject {
  const data = payload as {
    presentation?: PresentationProject;
    project?: PresentationProject;
    data?: PresentationProject;
  };
  return data.presentation ?? data.project ?? data.data ?? (payload as PresentationProject);
}

function unwrapPlan(payload: unknown): PresentationPlan {
  const data = payload as { plan?: PresentationPlan; data?: PresentationPlan };
  return data.plan ?? data.data ?? (payload as PresentationPlan);
}

type PresentationJobKind = "plan" | "generate" | "regenerate" | "export";

const PRESENTATION_JOB_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const PRESENTATION_ACK_STATUSES = new Set([
  "pending",
  "queued",
  "running",
  "processing",
  "completed",
  "completed_with_errors",
  "failed",
  "cancelled",
]);

function unwrapJobRef(payload: unknown, expectedKind: PresentationJobKind): JobRef {
  const data = payload && typeof payload === "object" && !Array.isArray(payload)
    ? payload as { job?: unknown; data?: unknown }
    : null;
  const nested = data?.job ?? data?.data ?? data;
  const value = nested && typeof nested === "object" && !Array.isArray(nested)
    ? nested as Record<string, unknown>
    : null;
  if (
    !value
    || typeof value.job_id !== "string"
    || !PRESENTATION_JOB_ID_PATTERN.test(value.job_id)
    || value.kind !== expectedKind
    || typeof value.status !== "string"
    || !PRESENTATION_ACK_STATUSES.has(value.status)
  ) {
    throw new PresentationApiError(
      "The server returned an invalid presentation job acknowledgement.",
      502,
      undefined,
      payload,
      API_ERROR_CODES.INVALID_RESPONSE,
    );
  }
  return {
    ...value,
    job_id: value.job_id,
  } as JobRef;
}

export async function listPresentations(signal?: AbortSignal): Promise<PresentationListResponse> {
  const payload = await request<PresentationListResponse | PresentationProject[] | { data: PresentationProject[] }>(
    PREFIX,
    { signal },
  );
  if (Array.isArray(payload)) return { items: payload, total: payload.length };
  const wrapped = payload as PresentationListResponse & { data?: PresentationProject[] };
  if (Array.isArray(wrapped.data)) return { items: wrapped.data, total: wrapped.data.length };
  return { items: wrapped.items ?? [], total: wrapped.total };
}

export function getPresentationCapabilities(signal?: AbortSignal): Promise<PresentationCapabilities> {
  return request(`${PREFIX}/capabilities`, { signal, timeoutMs: 15000 });
}

export async function createPresentation(input: CreatePresentationInput): Promise<PresentationProject> {
  return unwrapProject(
    await request(PREFIX, {
      method: "POST",
      body: JSON.stringify(input),
      idempotent: true,
    }),
  );
}

/**
 * Lists only KMJ jobs that the current teacher owns and can still use.
 * Ownership, completion and expiry are enforced by the API as well as by the
 * project-creation endpoint, so a stale browser selection cannot bypass them.
 */
export async function listSavedKmzhSources(signal?: AbortSignal): Promise<SavedKmzhSourceList> {
  const pages = await Promise.all(["kmzh.generate", "kmzh.classic.generate"].map((kind) => {
    const params = new URLSearchParams({ kind, status: "completed", limit: "100", offset: "0" });
    return request<SavedKmzhSourceList>(`/api/v1/generations?${params.toString()}`, { signal });
  }));
  const items = new Map(pages.flatMap((page) => Array.isArray(page.items) ? page.items : []).map((item) => [item.id, item]));
  return {
    items: [...items.values()].sort((left, right) => Date.parse(right.created_at) - Date.parse(left.created_at)),
    total: pages.every((page) => page.total !== undefined) ? pages.reduce((sum, page) => sum + (page.total ?? 0), 0) : undefined,
    has_more: pages.some((page) => page.has_more),
  };
}

export async function getPresentation(id: string, signal?: AbortSignal): Promise<PresentationProject> {
  try {
    return unwrapProject(await request(`${PREFIX}/${encodeURIComponent(id)}`, { signal, timeoutMs: 15000 }));
  } catch (error) {
    // Legacy bookmarks contain the retired service id rather than the new
    // canonical project id. Resolve only genuine 404s through the owner-scoped
    // migration bridge; authorization and server failures must not be masked.
    if (!(error instanceof PresentationApiError) || error.status !== 404 || signal?.aborted) {
      throw error;
    }
    return unwrapProject(
      await request(`${PREFIX}/legacy/${encodeURIComponent(id)}`, { signal }),
    );
  }
}

export async function updatePresentation(
  id: string,
  patch: Partial<PresentationProject> & Record<string, unknown>,
): Promise<PresentationProject> {
  return unwrapProject(
    await request(`${PREFIX}/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    }),
  );
}

export async function deletePresentation(id: string): Promise<void> {
  await request<void>(`${PREFIX}/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export async function startPlanJob(id: string, input: PlanJobInput = {}): Promise<JobRef> {
  return unwrapJobRef(
    await request(`${PREFIX}/${encodeURIComponent(id)}/plan-jobs`, {
      method: "POST",
      body: JSON.stringify({ regenerate: input.regenerate ?? false, instructions: input.instructions }),
      idempotent: true,
      expectedStatuses: [202],
    }),
    "plan",
  );
}

export async function updatePlan(
  presentationId: string,
  planId: string,
  input: UpdatePlanInput,
): Promise<PresentationPlan> {
  return unwrapPlan(
    await request(
      `${PREFIX}/${encodeURIComponent(presentationId)}/plans/${encodeURIComponent(planId)}`,
      { method: "PATCH", body: JSON.stringify(input) },
    ),
  );
}

export async function approvePlan(
  presentationId: string,
  planId: string,
  revision: number,
): Promise<PresentationPlan> {
  return unwrapPlan(
    await request(
      `${PREFIX}/${encodeURIComponent(presentationId)}/plans/${encodeURIComponent(planId)}/approve`,
      {
        method: "POST",
        body: JSON.stringify({ revision }),
        idempotent: true,
      },
    ),
  );
}

export async function estimateCost(
  presentationId: string,
  planVersionId: string,
): Promise<CostEstimate> {
  const payload = await request<CostEstimate | { estimate: CostEstimate; data?: CostEstimate }>(
    `${PREFIX}/${encodeURIComponent(presentationId)}/cost-estimates`,
    {
      method: "POST",
      body: JSON.stringify({ plan_version_id: planVersionId }),
      idempotent: true,
    },
  );
  const wrapped = payload as CostEstimate & {
    estimate?: CostEstimate;
    data?: CostEstimate;
  };
  return wrapped.estimate ?? wrapped.data ?? (payload as CostEstimate);
}

export async function startGeneration(
  presentationId: string,
  planVersionId: string,
): Promise<JobRef> {
  return unwrapJobRef(
    await request(`${PREFIX}/${encodeURIComponent(presentationId)}/generations`, {
      method: "POST",
      body: JSON.stringify({ plan_version_id: planVersionId }),
      idempotent: true,
      expectedStatuses: [202],
    }),
    "generate",
  );
}

export async function getJob(jobId: string, signal?: AbortSignal): Promise<JobState> {
  const payload = await request<JobState | { job: JobState; data?: JobState }>(
    `/api/v2/jobs/${encodeURIComponent(jobId)}`,
    { signal, timeoutMs: 15000 },
  );
  const wrapped = payload as JobState & { job?: JobState; data?: JobState };
  const job = wrapped.job ?? wrapped.data ?? (payload as JobState);
  if (isTerminalPresentationJob(job.status)) settleJobIdentity(job.id ?? job.job_id ?? jobId);
  return {
    ...job,
    id: job.id ?? job.job_id ?? jobId,
  };
}

export async function cancelJob(jobId: string): Promise<JobState> {
  const payload = await request<JobState | { job: JobState }>(
    `/api/v2/jobs/${encodeURIComponent(jobId)}/cancel`,
    { method: "POST", body: JSON.stringify({}), idempotent: true },
  );
  const wrapped = payload as JobState & { job?: JobState };
  return wrapped.job ?? (payload as JobState);
}

export async function updateSlide(
  presentationId: string,
  slideKey: string,
  spec: SlideSpec,
): Promise<JobRef> {
  return unwrapJobRef(
    await request(`${PREFIX}/${encodeURIComponent(presentationId)}/slides/${encodeURIComponent(slideKey)}`, {
      method: "PATCH",
      body: JSON.stringify({ spec }),
      expectedStatuses: [202],
    }),
    "regenerate",
  );
}

export async function regenerateSlide(
  presentationId: string,
  slideKey: string,
  instruction?: string,
): Promise<JobRef> {
  return unwrapJobRef(
    await request(
      `${PREFIX}/${encodeURIComponent(presentationId)}/slides/${encodeURIComponent(slideKey)}/regenerations`,
      {
        method: "POST",
        body: JSON.stringify({ instruction: instruction?.trim() || undefined }),
        idempotent: true,
        expectedStatuses: [202],
      },
    ),
    "regenerate",
  );
}

export async function activateSlideVersion(
  presentationId: string,
  slideKey: string,
  versionId: string,
): Promise<PresentationProject | Record<string, unknown>> {
  return request(
    `${PREFIX}/${encodeURIComponent(presentationId)}/slides/${encodeURIComponent(slideKey)}/versions/${encodeURIComponent(versionId)}/activate`,
    { method: "POST", body: JSON.stringify({}), idempotent: true },
  );
}

export async function createExport(
  presentationId: string,
  input: CreateExportInput,
): Promise<JobRef> {
  return unwrapJobRef(
    await request(`${PREFIX}/${encodeURIComponent(presentationId)}/exports`, {
      method: "POST",
      body: JSON.stringify(input),
      idempotent: true,
      expectedStatuses: [202],
    }),
    "export",
  );
}

export async function listExports(
  presentationId: string,
  signal?: AbortSignal,
): Promise<PresentationExport[]> {
  const payload = await request<PresentationExport[] | { items?: PresentationExport[]; exports?: PresentationExport[] }>(
    `${PREFIX}/${encodeURIComponent(presentationId)}/exports`,
    { signal, timeoutMs: 15000 },
  );
  if (Array.isArray(payload)) return payload;
  return payload.items ?? payload.exports ?? [];
}

export async function downloadExport(presentationId: string, exportId: string): Promise<Blob> {
  const token = getToken();
  const response = await fetchWithPolicy(
    `${API_BASE}${PREFIX}/${encodeURIComponent(presentationId)}/exports/${encodeURIComponent(exportId)}/download`,
    {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      cache: "no-store",
    },
    { errorFactory: presentationError },
  );
  if (!response.ok) throw await parseError(response);
  return response.blob();
}

export async function fetchPresentationAsset(urlOrPath: string, signal?: AbortSignal): Promise<Blob> {
  if (urlOrPath.startsWith("data:") || urlOrPath.startsWith("blob:")) {
    const response = await fetch(urlOrPath, { signal });
    return response.blob();
  }
  const token = getToken();
  const absolute = /^https?:\/\//i.test(urlOrPath);
  const url = absolute ? urlOrPath : `${API_BASE}${urlOrPath.startsWith("/") ? "" : "/"}${urlOrPath}`;
  const isOwnApi = !absolute || url.startsWith(`${API_BASE}/`);
  const response = await fetchWithPolicy(
    url,
    {
      headers: token && isOwnApi ? { Authorization: `Bearer ${token}` } : undefined,
      cache: "no-store",
      signal,
    },
    {
      errorFactory: presentationError,
      notifyOnUnauthorized: isOwnApi,
    },
  );
  if (!response.ok) throw await parseError(response);
  return response.blob();
}

export async function* streamJobEvents(
  jobId: string,
  signal?: AbortSignal,
  lastEventId?: string,
): AsyncGenerator<JobEvent> {
  const token = getToken();
  const headers = new Headers({ Accept: "text/event-stream" });
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (lastEventId) headers.set("Last-Event-ID", lastEventId);
  const response = await fetchWithPolicy(
    `${API_BASE}/api/v2/jobs/${encodeURIComponent(jobId)}/events`,
    {
      headers,
      cache: "no-store",
      signal,
    },
    {
      errorFactory: presentationError,
      timeoutMs: null,
    },
  );
  if (!response.ok) throw await parseError(response);
  if (!response.body) throw new Error("SSE response has no body");

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let event = "message";
  let data: string[] = [];
  let id: string | undefined;

  const flush = (): JobEvent | null => {
    if (data.length === 0) return null;
    const raw = data.join("\n");
    let parsed: unknown = raw;
    try {
      parsed = JSON.parse(raw);
    } catch {
      // Plain-text events are valid SSE.
    }
    const value = { id, event, data: parsed };
    event = "message";
    data = [];
    id = undefined;
    return value;
  };

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, "\n");
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        if (line === "") {
          const value = flush();
          if (value) yield value;
        } else if (line.startsWith("event:")) {
          event = line.slice(6).trim() || "message";
        } else if (line.startsWith("id:")) {
          id = line.slice(3).trim();
        } else if (line.startsWith("data:")) {
          data.push(line.slice(5).trimStart());
        }
      }
    }
    const value = flush();
    if (value) yield value;
  } finally {
    await reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
}

export function getDownloadFilename(responseName: string | undefined, fallback: string) {
  if (!responseName) return fallback;
  return responseName.replace(/[\\/:*?"<>|]+/g, "-");
}
