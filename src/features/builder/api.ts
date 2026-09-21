import {
  getGenerationJob,
  getToken,
  validateGenerationJobAcknowledgement,
  type GenerationJob,
} from "@/lib/api";
import { getApiBase } from "@/lib/api-base";
import {
  API_ERROR_CODES,
  ApiRequestError,
  fetchWithPolicy,
  readResponsePayload,
  requestJson,
} from "@/lib/http-client";
import { createIdempotencyKey } from "@/lib/idempotency";
import type {
  BuilderAsset,
  BuilderBuildRequest,
  BuilderBuildStatus,
  BuilderContentLanguage,
  BuilderConfig,
  BuilderEstimate,
  BuilderProject,
  BuilderProjectSummary,
  BuilderProjectsResponse,
  BuilderProjectType,
  BuilderVersion,
  BuilderVisibility,
} from "./types";
import { BUILDER_GENERATION_KIND } from "./persistence";

export type {
  BuilderAsset,
  BuilderConfig,
  BuilderProject,
  BuilderProjectSummary,
  BuilderVersion,
} from "./types";

function authHeaders(json = false): Headers {
  const headers = new Headers({ Accept: "application/json" });
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (json) headers.set("Content-Type", "application/json");
  return headers;
}

function validateBuilderJob(value: unknown, projectId: string): GenerationJob {
  const job = validateGenerationJobAcknowledgement(value, BUILDER_GENERATION_KIND);
  if (job.resource_id !== projectId) {
    throw new ApiRequestError(
      "The server returned a Builder job for a different project.",
      502,
      undefined,
      API_ERROR_CODES.INVALID_RESPONSE,
    );
  }
  return job;
}

export async function builderRequest<T>(
  path: string,
  method = "GET",
  body?: unknown,
  extraHeaders?: HeadersInit,
  timeoutMs = 620_000,
): Promise<T> {
  const multipart = typeof FormData !== "undefined" && body instanceof FormData;
  const headers = authHeaders(Boolean(body) && !multipart);
  new Headers(extraHeaders).forEach((value, key) => headers.set(key, value));
  return requestJson<T>(`${getApiBase()}/api/builder${path}`, {
    method,
    headers,
    cache: "no-store",
    body: body ? multipart ? body : JSON.stringify(body) : undefined,
  }, { timeoutMs });
}

export const builderApi = {
  config: () => builderRequest<BuilderConfig>("/config"),
  estimate: (payload: { mode: "generate" | "edit" | "fix"; project_type: BuilderProjectType; prompt: string; media_count: number }) =>
    builderRequest<BuilderEstimate>("/estimate", "POST", payload),
  async list(): Promise<BuilderProjectsResponse> {
    const items: BuilderProjectSummary[] = [];
    let total = 0;
    do {
      const response = await builderRequest<BuilderProjectsResponse | BuilderProjectSummary[]>(`/projects?limit=100&offset=${items.length}`);
      if (Array.isArray(response)) return { items: response, total: response.length };
      items.push(...response.items);
      total = response.total;
      if (response.items.length === 0) break;
    } while (items.length < total);
    return { items, total };
  },
  get: (id: string) => builderRequest<BuilderProject>(`/projects/${encodeURIComponent(id)}`),
  create: (payload: { title: string; description: string; project_type: BuilderProjectType; content_language: BuilderContentLanguage }) =>
    builderRequest<BuilderProject>("/projects", "POST", payload),
  update: (id: string, payload: { title?: string; description?: string; visibility?: BuilderVisibility; allow_duplicate?: boolean; content_language?: BuilderContentLanguage }) =>
    builderRequest<BuilderProject>(`/projects/${encodeURIComponent(id)}`, "PATCH", payload),
  remove: (id: string) => builderRequest<void>(`/projects/${encodeURIComponent(id)}`, "DELETE"),
  duplicate: (id: string) => builderRequest<BuilderProject>(`/projects/${encodeURIComponent(id)}/duplicate`, "POST"),
  async build(
    id: string,
    payload: BuilderBuildRequest,
    idempotencyKey = createIdempotencyKey(),
  ): Promise<GenerationJob> {
    const acknowledgement = await builderRequest<unknown>(
      `/projects/${encodeURIComponent(id)}/build`,
      "POST",
      payload,
      { "Idempotency-Key": idempotencyKey },
      30_000,
    );
    return validateBuilderJob(acknowledgement, id);
  },
  async latestBuild(id: string, activeOnly = true): Promise<GenerationJob | null> {
    const response = await builderRequest<unknown>(
      `/projects/${encodeURIComponent(id)}/build/latest?active_only=${activeOnly ? "true" : "false"}`,
      "GET",
      undefined,
      undefined,
      15_000,
    );
    return response === null
      ? null
      : validateBuilderJob(response, id);
  },
  buildStatus: (id: string, payload: BuilderBuildRequest, idempotencyKey: string) =>
    builderRequest<BuilderBuildStatus>(`/projects/${encodeURIComponent(id)}/build/status`, "POST", payload, {
      "Idempotency-Key": idempotencyKey,
    }, 30_000),
  async buildJob(id: string, jobId: string): Promise<GenerationJob> {
    return validateBuilderJob(await getGenerationJob(jobId), id);
  },
  saveFiles: (id: string, payload: { files: Record<string, string | null>; expected_version: number; expected_revision?: number; message: string }) =>
    builderRequest<BuilderProject>(`/projects/${encodeURIComponent(id)}/files`, "PATCH", payload),
  versions: (id: string) => builderRequest<BuilderVersion[]>(`/projects/${encodeURIComponent(id)}/versions`),
  restore: (id: string, version: number, expectedVersion: number, expectedRevision?: number) =>
    builderRequest<BuilderProject>(`/projects/${encodeURIComponent(id)}/versions/${version}/restore`, "POST", {
      expected_version: expectedVersion,
      expected_revision: expectedRevision,
    }),
  uploadAsset: async (id: string, file: File): Promise<BuilderAsset> => {
    const form = new FormData();
    form.append("file", file);
    return builderRequest<BuilderAsset>(`/projects/${encodeURIComponent(id)}/assets`, "POST", form);
  },
  removeAsset: (id: string, assetId: string) =>
    builderRequest<void>(`/projects/${encodeURIComponent(id)}/assets/${encodeURIComponent(assetId)}`, "DELETE"),
  async publish(id: string, visibility: Exclude<BuilderVisibility, "private">, allowDuplicate = false): Promise<BuilderProject> {
    const response = await builderRequest<{ project: BuilderProject; share_token: string; public_url: string }>(`/projects/${encodeURIComponent(id)}/publish`, "POST", {
      visibility,
      allow_duplicate: allowDuplicate,
    });
    return { ...response.project, share_url: response.public_url };
  },
};

export async function downloadProject(id: string, format: "html" | "zip") {
  const response = await fetchWithPolicy(`${getApiBase()}/api/builder/projects/${encodeURIComponent(id)}/download?format=${format}`, {
    headers: authHeaders(),
  }, { timeoutMs: 120_000 });
  if (!response.ok) {
    const payload = await readResponsePayload(response);
    throw new Error(typeof payload.data === "string" ? payload.data : "Не удалось скачать проект");
  }
  const url = URL.createObjectURL(await response.blob());
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `sandu-project.${format}`;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1_000);
}
