import { getToken, type GenerationJob } from "@/lib/api";
import { getApiBase } from "@/lib/api-base";
import { fetchWithPolicy, requestJson } from "@/lib/http-client";
import { saveBlob } from "@/lib/generation-download";
import type { CompetitionPresetInput } from "@/features/competition-admin/types";

export type Locale = "kk" | "ru";
export type Localized = Record<Locale, string>;
export type CompetitionPreset = CompetitionPresetInput & { updated_at?: string };
export type CompetitionInput = {
  competition_id: string;
  title: string;
  direction_id: string;
  role: string;
  subject: string;
  grade: string;
  language: Locale;
  stage: "regional" | "republican";
  author_idea: string;
  author_contribution: string;
  experience: { problem: string; application: string; novelty: string; task: string; results: string; materials: string };
  references: { author: string; title: string; year: string; url: string }[];
  confirmations: { unpublished: boolean; not_submitted: boolean; original: boolean };
  safe_mode: boolean;
};
export type CheckItem = { id: string; label: string; status: string; message: string; section_ids?: string[] };
export type CheckReport = { status: string; items: CheckItem[]; summary?: string; notice?: string; checked_at?: string; version?: number };
export type SimilarityReport = {
  provider: string;
  external_database_checked: boolean;
  similarity_score: number | null;
  risk: string;
  matches: { section_id?: string; fragment: string; reason: string; kind: string }[];
  notice: string;
  author_level: { id: string; label: string; status: string; message: string }[];
  status: string;
  items: CheckItem[];
};
export type CompetitionWork = {
  id: string;
  competition_id: string;
  preset_snapshot: CompetitionPreset;
  input: CompetitionInput;
  content: { title: string; sections: { id: string; title: string; body: string }[]; references: CompetitionInput["references"] };
  defense: null | { segments: { start_seconds: number; end_seconds: number; title: string; text: string }[] };
  slides: null | { slides: { number: number; title: string; bullets: string[]; speaker_notes: string; visual_hint: string }[] };
  video_plan: null | { scenes: { number: number; duration_seconds: number; visual: string; narration: string; on_screen_text: string; evidence: string[] }[]; total_seconds: number };
  reports: { rubric?: CheckReport; similarity?: SimilarityReport; compliance?: CheckReport };
  version: number;
  created_at: string;
  updated_at: string;
};
export type WorkSummary = { id: string; title: string; competition_id: string; competition_name?: Localized; kind?: string; year?: number; language?: Locale; updated_at: string; created_at: string; status?: string };

const base = () => `${getApiBase()}/pedagogical-competitions`;
export function competitionRequest<T>(path: string, method = "GET", body?: unknown, extraHeaders?: Record<string, string>): Promise<T> {
  const token = getToken();
  return requestJson<T>(`${base()}${path}`, {
    method, headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body !== undefined ? { "Content-Type": "application/json" } : {}), ...extraHeaders },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
}
export const getCompetitionConfig = () => competitionRequest<{ items: CompetitionPreset[]; current_year: number; warnings: string[] }>("/config");
export const listCompetitionWorks = () => competitionRequest<{ items: WorkSummary[]; total: number }>("/works");
export const getCompetitionWork = (id: string) => competitionRequest<CompetitionWork>(`/works/${encodeURIComponent(id)}`);
export const generateCompetition = (input: CompetitionInput, key: string) => competitionRequest<GenerationJob>("/generate", "POST", input, { "Idempotency-Key": key });
export const actOnCompetitionWork = (id: string, version: number, action: "rewrite" | "defense" | "slides" | "video_plan", key: string) => competitionRequest<GenerationJob>(`/works/${encodeURIComponent(id)}/actions`, "POST", { expected_version: version, action }, { "Idempotency-Key": key });
export const saveCompetitionWork = (work: CompetitionWork) => competitionRequest<CompetitionWork>(`/works/${encodeURIComponent(work.id)}`, "PATCH", { expected_version: work.version, content: work.content, experience: work.input.experience });
export const checkCompetitionWork = (id: string, kind: "rubric" | "similarity" | "compliance") => competitionRequest<CheckReport | SimilarityReport>(`/works/${encodeURIComponent(id)}/checks/${kind}`, "POST");
export const getVideoHandoff = (id: string) => competitionRequest<{ target_path: string; payload: { prompt: string; title: string; script: string; language: Locale; requirements: string; source_work_id: string; scenes: NonNullable<CompetitionWork["video_plan"]>["scenes"] }; notice: string }>(`/works/${encodeURIComponent(id)}/video-handoff`);

export async function exportCompetitionWork(id: string, format: "docx" | "pdf" | "pptx", title: string, draft = false): Promise<void> {
  const response = await fetchWithPolicy(`${base()}/works/${encodeURIComponent(id)}/export?format=${format}${draft ? "&allow_incomplete=true" : ""}`, { headers: { Authorization: `Bearer ${getToken()}` } });
  if (!response.ok) throw new Error("EXPORT_FAILED");
  saveBlob(await response.blob(), `${title.replace(/[\\/:*?"<>|]/g, " ").slice(0, 80)}.${format}`);
}
