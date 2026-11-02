import { getToken, type GenerationJob, validateGenerationJobAcknowledgement } from "@/lib/api";
import { getApiBase } from "@/lib/api-base";
import { ApiRequestError, fetchWithPolicy, requestJson } from "@/lib/http-client";
import type { AiUsage, Assessment, Catalog, DocumentKind, ExportFormatting, Language, SavedProject, ScienceRequest, Template, UploadedDocument } from "./types";

const PREFIX = "/api/v1/science-pro";
function headers(json = true) { const h = new Headers(); if (json) h.set("Content-Type", "application/json"); const token = getToken(); if (token) h.set("Authorization", `Bearer ${token}`); return h; }
function request<T>(path: string, method = "GET", body?: unknown, signal?: AbortSignal) { return requestJson<T>(`${getApiBase()}${PREFIX}${path}`, { method, headers: headers(), body: body === undefined ? undefined : JSON.stringify(body), cache: "no-store", signal }, { timeoutMs: 45_000 }); }
export const scienceApi = {
  catalog: (signal?: AbortSignal) => request<Catalog>("/catalog", "GET", undefined, signal),
  assess: (body: ScienceRequest) => request<Assessment>("/assess", "POST", body),
  consultation: (jobId: string) => request<{ project_id: string | null; request: ScienceRequest }>(`/consultations/${encodeURIComponent(jobId)}`),
  async consult(body: ScienceRequest, projectId: string, key: string): Promise<GenerationJob> { const h = headers(); h.set("Idempotency-Key", key); const value = await requestJson<unknown>(`${getApiBase()}${PREFIX}/consult`, { method: "POST", headers: h, body: JSON.stringify({ request: body, project_id: projectId }) }, { timeoutMs: 30_000 }); return validateGenerationJobAcknowledgement(value, "science_pro.consult"); },
  projects: () => request<{ items: SavedProject[]; total?: number }>("/projects"),
  save: (body: ScienceRequest, id: string | null) => request<SavedProject>(id ? `/projects/${encodeURIComponent(id)}` : "/projects", id ? "PUT" : "POST", { title: body.title.trim() || "Ғылыми жоба PRO", request: body }),
  open: (id: string) => request<SavedProject>(`/projects/${encodeURIComponent(id)}`),
  remove: (id: string) => request<void>(`/projects/${encodeURIComponent(id)}`, "DELETE"),
  document: (id: string) => request<UploadedDocument>(`/uploads/${encodeURIComponent(id)}`),
  usage: (id: string) => request<{ items: AiUsage[] }>(`/projects/${encodeURIComponent(id)}/ai-usage`),
  updateUsage: (projectId: string, id: string, body: Pick<AiUsage, "output_use_location" | "author_verification" | "author_changes">) => request<AiUsage>(`/projects/${encodeURIComponent(projectId)}/ai-usage/${encodeURIComponent(id)}`, "PATCH", body),
  assessProject: (id: string) => request<Assessment>(`/projects/${encodeURIComponent(id)}/assess`, "POST"),
  async upload(file: File, kind: DocumentKind, language: Language) { const body = new FormData(); body.append("file", file); body.append("kind", kind); body.append("language", language); return requestJson<UploadedDocument>(`${getApiBase()}${PREFIX}/uploads`, { method: "POST", headers: headers(false), body, cache: "no-store" }, { timeoutMs: 90_000 }); },
  async export(body: ScienceRequest, template: Template, format: "docx" | "pdf", projectId?: string, formatting?: ExportFormatting) {
    const response = await fetchWithPolicy(`${getApiBase()}${PREFIX}/export`, { method: "POST", headers: headers(), body: JSON.stringify({ request: body, template, format, ...(projectId ? { project_id: projectId } : {}), ...(formatting ? { formatting } : {}) }) }, { timeoutMs: 90_000 });
    if (!response.ok) throw new ApiRequestError("Document export failed", response.status);
    const expected = format === "pdf" ? "application/pdf" : "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    if (!response.headers.get("Content-Type")?.includes(expected)) throw new ApiRequestError("Unexpected document response", 502);
    const blob = await response.blob(); if (!blob.size) throw new ApiRequestError("Empty document response", 502);
    const signature = new Uint8Array(await blob.slice(0, 5).arrayBuffer());
    const valid = format === "pdf" ? String.fromCharCode(...signature) === "%PDF-" : signature[0] === 0x50 && signature[1] === 0x4b;
    if (!valid) throw new ApiRequestError("Invalid document signature", 502); return blob;
  },
};
