export type Language = "kk" | "ru";
export type ModeId = "idea" | "passport" | "methods" | "plan" | "literature" | "editing" | "visualization" | "novelty" | "antiplagiarism" | "diary" | "stand" | "defense" | "regional_audit" | "republican_audit" | "package";
export type ProjectType = "research" | "engineering" | "digital" | "social" | "humanities";
export type Template = "passport" | "structure" | "plan" | "diary" | "literature" | "ai_declaration" | "review" | "stand" | "audit";
export type DocumentKind = "project" | "abstract" | "review" | "antiplagiarism" | "ai_declaration" | "ethics" | "diary" | "contribution" | "application" | "official_rules";
export type CheckStatus = "matches" | "needs_information" | "does_not_match" | "not_provided" | "cannot_verify";
export type EvidenceStatus = "measured" | "observed" | "documented" | "calculated" | "preliminary" | "needs_verification" | "planned";
export interface Datum { label: string; value: number; status?: EvidenceStatus; unit?: string }
export interface DiaryEntry { date: string; stage: string; goal: string; action: string; data: string; difficulties: string; changes: string; evidence: string; author: string }
export interface ScienceRequest {
  mode: ModeId; language: Language; title: string; academic_year: string; competition: string; grades: number[]; section: string;
  project_type: ProjectType; stage: number; direction: string; idea: string; problem: string; relevance: string; research_question: string; goal: string; tasks: string[];
  object: string; subject: string; hypothesis: string; methods: string[]; sources: string[]; region: string; supervisor: boolean | null;
  materials: string; equipment: string; deadline: string; data_status: "not_started" | "collecting" | "collected"; existing_results: string;
  authored_text: string; abstract_text: string; english_abstract: string; data: Datum[]; data_order: "comparison" | "time"; percent_change_meaningful: boolean; diary: DiaryEntry[]; contributions: string[];
  novelty: string; practical_significance: string; safety: string; limitations: string; stages: string; recording: string; expert_level: number; expert_question: string;
  expert_answer: string; document_ids: string[];
}
export interface Check { id: string; title: string; status: CheckStatus; detail: string; location?: string; reference?: string; evidence_excerpt?: string; student_action?: string }
export interface ResultSection { id: string; title: string; body: string; questions: string[]; table?: { columns: string[]; rows: string[][] } | null }
export interface Provenance { status?: string; official_rules_verified: boolean; notice: string; official_rule_url?: string; source_notes?: string[]; academic_year?: string; verified_at?: string }
export interface Assessment {
  mode: ModeId; title: string; sections: ResultSection[]; checks: Check[]; official_checks: Check[]; quality_checks: Check[];
  next_steps: string[]; provenance: Provenance; ai_generated: boolean;
  eligibility: { eligible: boolean; issues: string[]; [key: string]: unknown };
  statistics?: Record<string, number | string | null> | null;
}
export interface Catalog {
  modes: { id: ModeId; title_kk?: string; title_ru?: string; kk?: string; ru?: string }[];
  sections: { id: string; direction: string; title_kk: string; title_ru: string }[];
  provenance: Provenance; ai_cost_tokens?: number;
}
export interface UploadedDocument {
  id: string; name: string; kind: DocumentKind; size_bytes: number; pages: number | null; extracted_text: string;
  inspection_status: "readable" | "partial" | "unreadable"; format_checks: Check[]; official_rules_verified: boolean;
  unreadable_pages?: number[]; text_truncated?: boolean;
}
export interface SavedProject { id: string; title: string; request: ScienceRequest; result: Assessment | null; created_at: string; updated_at: string }
export interface AiUsage { id: string; project_id: string; used_at: string; tool: string; model_version: string | null; stage: string; purpose: string; prompt_summary: string; output_use_location: string; author_verification: string; author_changes: string }
export interface Draft { version: 1; request: ScienceRequest; dataText: string; projectId: string | null; documents: UploadedDocument[] }
export interface ExportFormatting { font_family: "Times New Roman" | "Arial" | "Calibri"; font_size: number; line_spacing: number; margins_cm: { left: number; right: number; top: number; bottom: number }; source: "editorial" | "user_provided"; source_clause: string }
