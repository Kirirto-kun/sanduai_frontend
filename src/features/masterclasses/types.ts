import type { MasterclassConfigInput, MasterclassLanguage } from "@/features/masterclass-admin/types";
export type Locale = "ru" | "kk";
export type MasterclassInput = {
  institution_type: string; audience_id: string; topic: string; goal: string;
  duration_minutes: number; participant_count: number; format_id: string; style_id: string;
  direction_ids: string[]; difficulty_level: string; language: MasterclassLanguage;
  include_host_speech: boolean; include_case: boolean;
  library_mode: "standard" | "exhibition" | "reading_club" | "qr_quest" | "literary_evening" | "book_discussion" | "author_evening" | "poetry" | "children_reading";
  context: string; available_resources: string;
};
export type Topic = { title: string; description: string };
export type PracticalTask = { title: string; goal: string; duration_seconds: number; materials: string[]; host_instruction: string; participant_action: string; steps: string[]; expected_product: string };
export type Stage = { id: string; title: string; start_seconds: number; end_seconds: number; mode: "theory" | "practice"; host_action: string; participant_action: string; host_speech: string | null; task: PracticalTask | null };
export type Interactive = { id: string; title: string; kind: string; instructions: string; vibe_prompt: string; hand_tracking_prompt: string; three_d_prompt: string };
export type MasterclassContent = {
  title: string; goal: string; objectives: string[]; expected_product: string;
  grouping: { method: string; group_count: number; group_size_min: number; group_size_max: number };
  resources: { name: string; unit: string; quantity: number; scope: "participant" | "group" | "shared" }[];
  stages: Stage[]; interactives: Interactive[]; case_study: string;
  prompt_lab: null | { tool: string; purpose: string; weak_prompt: string; improved_prompt: string; steps: string[]; expected_output: string; pedagogical_use: string };
  steam: null | { problem: string; build: string; test: string; failure_analysis: string; revise: string };
  library_materials: null | {
    exhibition: { title: string; slogan: string; sections: string[]; placement: string; visual_style: string; qr_content: string; interactive_task: string };
    reading_club: { format: string; steps: string[]; questions: string[] };
    qr_quest: { stations: { number: number; book_or_location: string; task: string; hint: string; code: string }[]; final_code: string };
  };
  reflection: string; conclusion: string;
  feedback_questions: { id: string; text: string; kind: "text" | "rating" }[];
};
export type Slides = { slides: { number: number; title: string; bullets: string[]; speaker_notes: string; visual_hint: string }[] };
export type Worksheet = { title: string; key_ideas: string[]; tasks: { title: string; instructions: string; answer_lines: number }[]; checklist: string[]; prompts: { title: string; prompt: string }[]; links: { label: string; url: string }[]; reflection: string; takeaway: string };
export type Certificate = { participant_name: string; organization: string; host: string; date: string; topic: string };
export type Share = { token: string; url: string; public_path?: string; qr_png_url?: string; material_links?: Record<string, string>; version?: number };
export type MasterclassWork = {
  id: string; input: MasterclassInput; config_snapshot: MasterclassConfigInput; content: MasterclassContent;
  slides: Slides | null; worksheet: Worksheet | null; certificate: Certificate | null;
  cover: null | { filename: string; width: number; height: number; url: string };
  share: Share | null; timing: Record<string, number>; version: number; token_cost: number; created_at: string; updated_at: string;
};
export type WorkSummary = { id: string; title: string; language: MasterclassLanguage; institution_type: string; duration_minutes: number; participant_count: number; created_at: string; updated_at: string };
export type Action = { action: "regenerate_block" | "enhance" | "adapt_duration" | "adapt_audience" | "slides" | "worksheet" | "participant_package"; stage_id?: string; enhancement?: "creative" | "more_practice" | "less_theory" | "interactive" | "steam" | "ai" | "national" | "online"; duration_minutes?: number; institution_type?: string; audience_id?: string; difficulty_level?: string; instructions?: string };
export type Material = "full" | "short" | "slides" | "worksheet" | "package" | "certificate";
export type ExportFormat = "docx" | "pdf" | "pptx" | "zip";
export type SharedMasterclass = { version: number; title: string; slides: Slides | null; worksheet: Worksheet | null; language: MasterclassLanguage; duration_minutes: number; participant_count: number; expected_product: string; objectives: string[]; feedback_questions: MasterclassContent["feedback_questions"]; material_links: Record<string, string>; cover_url?: string | null };
export type FeedbackResponse = { id: string; name: string; answers: Record<string, string | number>; question_snapshot: MasterclassContent["feedback_questions"] | null; created_at: string };
