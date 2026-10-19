import { getToken, type GenerationJob } from "@/lib/api";
import { getApiBase } from "@/lib/api-base";
import { fetchWithPolicy, requestJson } from "@/lib/http-client";
import { saveBlob } from "@/lib/generation-download";
import { MASTERCLASS_HISTORY_PAGE_SIZE, type HistoryPage } from "./history-pagination";
import type { MasterclassConfig } from "@/features/masterclass-admin/types";
import type { MasterclassHandoffPayload, MasterclassHandoffTarget } from "./handoff-policy";
import type { Action, Certificate, ExportFormat, FeedbackResponse, MasterclassContent, MasterclassInput, MasterclassWork, Material, Share, SharedMasterclass, WorkSummary } from "./types";
export type { MasterclassHandoffTarget } from "./handoff-policy";
export type MasterclassHandoff = { target_path: string; payload: MasterclassHandoffPayload; notice?: string };
const base = () => `${getApiBase()}/masterclasses`;
export function masterclassRequest<T>(path: string, method = "GET", body?: unknown, headers?: Record<string, string>, publicRequest = false): Promise<T> {
  const token = publicRequest ? null : getToken();
  return requestJson<T>(`${base()}${path}`, { method, headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body !== undefined ? { "Content-Type": "application/json" } : {}), ...headers }, ...(body !== undefined ? { body: JSON.stringify(body) } : {}) });
}
export const getMasterclassConfig = () => masterclassRequest<MasterclassConfig>("/config");
export const listMasterclassWorks = (limit = MASTERCLASS_HISTORY_PAGE_SIZE, offset = 0) => masterclassRequest<HistoryPage<WorkSummary>>(`/works?limit=${limit}&offset=${offset}`);
export const getMasterclassWork = (id: string) => masterclassRequest<MasterclassWork>(`/works/${encodeURIComponent(id)}`);
export const generateMasterclass = (input: MasterclassInput, key: string) => masterclassRequest<GenerationJob>("/generate", "POST", input, { "Idempotency-Key": key });
export const suggestMasterclassTopics = (input: MasterclassInput, key: string) => masterclassRequest<GenerationJob>("/topics", "POST", input, { "Idempotency-Key": key });
export const actOnMasterclass = (work: MasterclassWork, action: Action, key: string) => masterclassRequest<GenerationJob>(`/works/${work.id}/actions`, "POST", { expected_version: work.version, ...action }, { "Idempotency-Key": key });
export const saveMasterclass = (work: MasterclassWork, content: MasterclassContent) => masterclassRequest<MasterclassWork>(`/works/${work.id}`, "PATCH", { expected_version: work.version, content });
export const saveCertificate = (work: MasterclassWork, certificate: Certificate) => masterclassRequest<MasterclassWork>(`/works/${work.id}/certificate`, "POST", { expected_version: work.version, ...certificate });
export const shareMasterclass = (work: MasterclassWork) => masterclassRequest<Share>(`/works/${work.id}/share`, "POST", { expected_version: work.version });
export const revokeMasterclassShare = (work: MasterclassWork) => masterclassRequest<unknown>(`/works/${work.id}/share?expected_version=${work.version}`, "DELETE");
export const getMasterclassFeedback = (id: string, offset = 0) => masterclassRequest<{ items: FeedbackResponse[]; total: number }>(`/works/${id}/feedback?limit=30&offset=${offset}`);
export function getMasterclassHandoff(id: string, target: MasterclassHandoffTarget, stageId?: string, interactiveId?: string, variant?: "default" | "hand_tracking" | "three_d"): Promise<MasterclassHandoff> {
  const params = new URLSearchParams(); if (stageId) params.set("stage_id", stageId); if (interactiveId) params.set("interactive_id", interactiveId);
  if (variant) params.set("variant", variant);
  return masterclassRequest<MasterclassHandoff>(`/works/${encodeURIComponent(id)}/handoff/${target}?${params}`);
}
export const getSharedMasterclass = (token: string) => masterclassRequest<SharedMasterclass>(`/shared/${encodeURIComponent(token)}`, "GET", undefined, undefined, true);
export const submitMasterclassFeedback = (token: string, answers: Record<string, string | number>, name: string, expectedVersion: number) => masterclassRequest<unknown>(`/shared/${encodeURIComponent(token)}/feedback`, "POST", { answers, name, expected_version: expectedVersion }, undefined, true);
export async function exportMasterclass(id: string, material: Material, format: ExportFormat, title: string, publicToken?: string): Promise<void> {
  const route = publicToken ? `/shared/${encodeURIComponent(publicToken)}/export` : `/works/${encodeURIComponent(id)}/export`;
  const response = await fetchWithPolicy(`${base()}${route}?material=${material}&format=${format}`, { headers: publicToken ? {} : { Authorization: `Bearer ${getToken()}` } });
  if (!response.ok) throw new Error(`Не удалось скачать файл (${response.status}).`);
  saveBlob(await response.blob(), `${title.replace(/[\\/:*?"<>|]/g, " ").slice(0, 80)}-${material}.${format}`);
}
export async function uploadMasterclassCover(work: MasterclassWork, file: File): Promise<MasterclassWork> {
  const body = new FormData(); body.append("file", file); body.append("expected_version", String(work.version));
  return requestJson<MasterclassWork>(`${base()}/works/${work.id}/cover`, { method: "POST", headers: { Authorization: `Bearer ${getToken()}` }, body });
}
export const deleteMasterclassCover = (work: MasterclassWork) => masterclassRequest<MasterclassWork>(`/works/${work.id}/cover?expected_version=${work.version}`, "DELETE");
