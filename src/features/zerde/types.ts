export type Language = "kk" | "ru";
export type ModeId = "idea" | "methods" | "plan" | "diary" | "contribution" | "editing" | "visualization" | "antiplagiarism" | "ai_declaration" | "ethics" | "audit" | "defense" | "stand" | "package";
export type CheckStatus = "matches" | "needs_information" | "does_not_match" | "not_provided" | "cannot_verify";
export type ProjectType = "research" | "engineering" | "digital" | "social" | "creative";
export type Template = "structure" | "plan" | "diary" | "contribution" | "ai_declaration" | "ethics" | "antiplagiarism" | "stand";
export type DocumentKind = "project" | "abstract" | "review" | "antiplagiarism" | "ai_declaration" | "ethics" | "diary" | "contribution" | "application" | "official_rules";
export interface ZerdeRequest {
  mode: ModeId; language: Language; title: string; grades: number[]; section: string;
  project_type: ProjectType; stage: number; authored_text: string; research_question: string; goal: string;
  methods: string[]; sources: string[]; data: { label: string; value: number }[]; registration_code: string; document_ids: string[];
}
export interface Check { id: string; title: string; status: CheckStatus; detail: string; location?: string; reference?: string }
export interface Provenance { status: string; official_rules_verified: boolean; notice: string }
export interface Assessment {
  mode: ModeId; title: string; eligibility: { eligible: boolean; age_category: string; effective_grade: number; abstract_word_limit: number; recommended_pages: number; issues: string[] };
  sections: { id: string; title: string; body: string; questions: string[]; table?: { columns: string[]; rows: string[][] } | null }[];
  checks: Check[]; next_steps: string[]; provenance: Provenance; ai_generated: boolean;
}
export interface Catalog {
  modes: { id: ModeId; title_kk: string; title_ru: string }[];
  sections: { id: string; direction: string; title_kk: string; title_ru: string }[];
  provenance: Provenance;
  ai_cost_tokens?: number;
}
export interface UploadedDocument {
  id: string; name: string; kind: DocumentKind; size_bytes: number; pages: number | null;
  extracted_text: string; inspection_status: "readable" | "partial" | "unreadable";
  format_checks: Check[]; official_rules_verified: boolean;
}
export interface SavedProject { id: string; title: string; request: ZerdeRequest; result: Assessment | null; created_at: string; updated_at: string }
export interface Draft { request: ZerdeRequest; dataText: string; projectId: string | null; documents: UploadedDocument[] }
