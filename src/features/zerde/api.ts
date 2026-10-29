import { getToken, type GenerationJob } from "@/lib/api";
import { getApiBase } from "@/lib/api-base";
import { fetchWithPolicy, requestJson } from "@/lib/http-client";
import type { Assessment, Catalog, DocumentKind, SavedProject, Template, UploadedDocument, ZerdeRequest } from "./types";

const PREFIX = "/api/v1/zerde";
function headers(json = true) {
  const h = new Headers(); if (json) h.set("Content-Type", "application/json");
  const token = getToken(); if (token) h.set("Authorization", `Bearer ${token}`); return h;
}
function request<T>(path: string, method = "GET", body?: unknown, signal?: AbortSignal) {
  return requestJson<T>(`${getApiBase()}${PREFIX}${path}`, { method, headers: headers(), body: body === undefined ? undefined : JSON.stringify(body), cache: "no-store", signal }, { timeoutMs: 45_000 });
}
export const zerdeApi = {
  catalog: (signal?: AbortSignal) => request<Catalog>("/catalog", "GET", undefined, signal),
  assess: (body: ZerdeRequest) => request<Assessment>("/assess", "POST", body),
  consult: (body: ZerdeRequest, projectId: string, key: string) => requestJson<GenerationJob>(`${getApiBase()}${PREFIX}/consult`, { method: "POST", headers: new Headers([...headers().entries(), ["Idempotency-Key", key]]), body: JSON.stringify({ request: body, project_id: projectId }) }, { timeoutMs: 30_000 }),
  projects: () => request<{ items: SavedProject[] }>("/projects"),
  save: (body: ZerdeRequest, id: string | null) => request<SavedProject>(id ? `/projects/${encodeURIComponent(id)}` : "/projects", id ? "PUT" : "POST", { title: body.title.trim() || "Зерде", request: body }),
  open: (id: string) => request<SavedProject>(`/projects/${encodeURIComponent(id)}`),
  document: (id: string) => request<UploadedDocument>(`/uploads/${encodeURIComponent(id)}`),
  assessProject: (id: string) => request<SavedProject>(`/projects/${encodeURIComponent(id)}/assess`, "POST"),
  async upload(file: File, kind: DocumentKind): Promise<UploadedDocument> {
    const body = new FormData(); body.append("file", file); body.append("kind", kind);
    return requestJson<UploadedDocument>(`${getApiBase()}${PREFIX}/uploads`, { method: "POST", headers: headers(false), body, cache: "no-store" }, { timeoutMs: 90_000 });
  },
  async export(body: ZerdeRequest, template: Template, format: "docx" | "pdf", audience: "jury" | "administrative"): Promise<Blob> {
    const response = await fetchWithPolicy(`${getApiBase()}${PREFIX}/export`, { method: "POST", headers: headers(), body: JSON.stringify({ request: body, template, format, audience }) }, { timeoutMs: 90_000 });
    return response.blob();
  },
};
