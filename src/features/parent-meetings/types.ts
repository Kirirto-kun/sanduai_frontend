import type { ContentLanguage } from "@/lib/content-languages";

export type InterfaceLanguage = "ru" | "kk";
export type MeetingFormat = "auto" | "traditional" | "training" | "interactive" | "workshop" | "family_values" | "quest" | "round_table" | "conference";
export type MeetingInput = {
  organization: "school" | "kindergarten"; class_group: string; topic: string;
  duration_minutes: number; participant_count: number; delivery_format: "offline" | "online" | "hybrid";
  meeting_format: MeetingFormat; goal: string; school_period: string; issues: string[];
  specialists: string[]; resources: string[]; special_requests: string; institution_name: string;
  meeting_date: string; meeting_time: string; venue: string; include_digital_tools: boolean;
  language: ContentLanguage; defaults_accepted: boolean;
};
export type StageKind = "welcome" | "training" | "introduction" | "grouping" | "practice" | "information" | "game" | "reflection" | "closing";
export type MeetingStage = {
  kind: StageKind; title: string; method: string; purpose: string; materials: string[]; duration_minutes: number;
  host_script: string; participant_action: string; instructions: string; expected_result: string; transition: string;
  start_minute: number; end_minute: number;
};
export type InteractiveTask = {
  kind: "case" | "laboratory" | "agreement"; title: string; method: string; purpose: string; materials: string[];
  duration_minutes: number; steps: string[]; host_script: string; participant_action: string; case_text: string;
  product_example: string; expected_result: string;
};
export type MeetingResult = {
  schema_version: "parent-meeting.v1"; title: string; topic: string; organization: MeetingInput["organization"];
  class_group: string; institution_name: string; duration_minutes: number; participant_count: number;
  delivery_format: MeetingInput["delivery_format"]; language: ContentLanguage; tokens_used: number;
  goal: string; objectives: string[]; outcomes: string[]; assumptions: string[]; selected_format: Exclude<MeetingFormat, "auto">;
  format_reason: string; concept: { name: string; description: string; final_product: string };
  preparation: string[]; materials: string[]; stages: MeetingStage[]; interactive_tasks: InteractiveTask[];
  invitation: { title: string; text: string; date: string; time: string; venue: string };
  slides: { number: number; title: string; on_screen: string; visual: string }[];
  training_cards: { title: string; instructions: string; content: string }[];
  questionnaire: { title: string; anonymous: boolean; instructions: string; questions: { question: string; options: string[] }[] };
  worksheets: { task_title: string; instructions: string; content: string; conclusion_question: string }[];
  reflection: { title: string; instructions: string; host_script: string; questions: string[] };
  reflection_sheet: string; recommendations: string[]; closing_script: string; protocol_template: string;
  national_values: { value: string; action: string }[];
  digital_tools: { name: string; purpose: string; prompt: string; offline_alternative: string }[];
  safety_notes: string[]; references: string[]; quality_checks: { code: string; label: string; passed: boolean }[];
};
