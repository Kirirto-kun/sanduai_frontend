import { getToken } from "./api";
import { getApiBase } from "./api-base";
import {
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
  PresentationListResponse,
  PresentationPlan,
  PresentationProject,
  SlideSpec,
  UpdatePlanInput,
} from "@/types/presentations";

const API_BASE = getApiBase();
const PREFIX = "/api/v2/presentations";

export class PresentationApiError extends ApiRequestError {
  public readonly serverCode?: string;

  constructor(
    message: string,
    status: number,
    serverCode?: string,
    details?: unknown,
    stableCode: ApiErrorCode = apiErrorCodeForStatus(status),
  ) {
    super(message, status, details, stableCode);
    this.name = "PresentationApiError";
    this.serverCode = serverCode;
  }
}

function idempotencyKey() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function presentationError(failure: ApiFailure): PresentationApiError {
  const payload = failure.details && typeof failure.details === "object"
    ? failure.details as { detail?: unknown; message?: string; code?: string }
    : null;
  const detail = payload?.detail;
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
      payload?.message ??
      (typeof detail === "string" ? detail : undefined) ??
      validationMessage ??
      failure.message;
    return new PresentationApiError(
      message,
      failure.status,
      payload.code,
      detail ?? payload,
      failure.code,
    );
  }

  return new PresentationApiError(
    failure.message,
    failure.status,
    undefined,
    failure.details,
    failure.code,
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
  options: RequestInit & { idempotent?: boolean } = {},
): Promise<T> {
  const { idempotent, ...requestInit } = options;
  const token = getToken();
  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type") && options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  headers.set("Accept", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (idempotent) headers.set("Idempotency-Key", idempotencyKey());

  return requestJson<T>(`${API_BASE}${path}`, {
    ...requestInit,
    headers,
    cache: "no-store",
  }, {
    errorFactory: presentationError,
  });
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

function unwrapJobRef(payload: unknown): JobRef {
  const data = payload as { job?: JobRef; data?: JobRef; id?: string; job_id?: string };
  const value = data.job ?? data.data ?? data;
  return {
    ...value,
    job_id: value.job_id ?? value.id ?? "",
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

export async function createPresentation(input: CreatePresentationInput): Promise<PresentationProject> {
  return unwrapProject(
    await request(PREFIX, {
      method: "POST",
      body: JSON.stringify(input),
      idempotent: true,
    }),
  );
}

export async function getPresentation(id: string, signal?: AbortSignal): Promise<PresentationProject> {
  try {
    return unwrapProject(await request(`${PREFIX}/${encodeURIComponent(id)}`, { signal }));
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
      body: JSON.stringify(input),
      idempotent: true,
    }),
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
    }),
  );
}

export async function getJob(jobId: string, signal?: AbortSignal): Promise<JobState> {
  const payload = await request<JobState | { job: JobState; data?: JobState }>(
    `/api/v2/jobs/${encodeURIComponent(jobId)}`,
    { signal },
  );
  const wrapped = payload as JobState & { job?: JobState; data?: JobState };
  const job = wrapped.job ?? wrapped.data ?? (payload as JobState);
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
    }),
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
      },
    ),
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
): Promise<PresentationExport | JobRef> {
  return request(`${PREFIX}/${encodeURIComponent(presentationId)}/exports`, {
    method: "POST",
    body: JSON.stringify(input),
    idempotent: true,
  });
}

export async function listExports(
  presentationId: string,
  signal?: AbortSignal,
): Promise<PresentationExport[]> {
  const payload = await request<PresentationExport[] | { items?: PresentationExport[]; exports?: PresentationExport[] }>(
    `${PREFIX}/${encodeURIComponent(presentationId)}/exports`,
    { signal },
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
