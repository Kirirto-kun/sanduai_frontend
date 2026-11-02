import type { ContentLanguage } from "@/lib/content-languages";

export type ProjectType = "scientific" | "ecological" | "stem" | "steam" | "cognitive" | "social" | "national_values" | "creative" | "family" | "long_term" | "pedagogical" | "competition";
export type OutputMode = "ideas" | "scientific_project" | "ecological_project" | "stem_project" | "weekly_project" | "long_term_project" | "pedagogical_project" | "competition_project" | "presentation_plan" | "defense" | "full_package";
export type AgeGroup = "early" | "younger" | "middle" | "older" | "preparatory";
export type Duration = "one_day" | "short" | "week" | "two_weeks" | "month" | "quarter" | "half_year" | "year";
export type ProjectInput = {
  topic: string; project_type: ProjectType; output_mode: OutputMode; age_group: AgeGroup;
  participant_count: number; duration: Duration; goal: string; problem: string; venue: string;
  season: string; materials: string[]; expected_product: string; author: string; kindergarten: string;
  locality: string; academic_year: string; parent_participation: "none" | "optional" | "active";
  is_competition: boolean; competition_rules: string; accessibility_notes: string; notes: string;
  project_status: "planned" | "in_progress" | "completed"; observations: string; language: ContentLanguage;
};
export type CalendarEntry = { period: string; goal: string; child_action: string; teacher_action: string; materials: string[]; expected_result: string; recording: string; session_minutes: number };
export type Experiment = { title: string; question: string; hypothesis: string; materials: string[]; safety: string[]; adult_preparation: string; child_action: string; steps: string[]; observation_period: string; recording: string; comparison: string; conclusion_questions: string[]; duration_minutes: number };
export type ProjectResult = {
  title: string; summary: string; goal: string; assumptions: string[];
  sections: { id: string; title: string; content: string }[];
  ideas: { title: string; question: string; activity: string; product: string }[];
  calendar: CalendarEntry[]; experiments: Experiment[];
  diary: { period: string; activity: string; observation: string; result: string }[];
  artifacts: { title: string; instructions: string; content: string }[];
  slides: { number: number; title: string; on_screen: string; visual: string; photo_placeholder: string; speaker_notes: string; shown_result: string }[];
  defense_script: string; expected_results: string[]; actual_results: string[];
  evaluation: { criterion: string; evidence: string }[];
  development: { direction: string; child_action: string }[];
  values: { value: string; child_action: string }[];
  inclusion: string[]; safety: string[];
  sources: { organization: string; title: string; url: string; verification_status: "unverified" }[];
  topic: string; project_type: ProjectType; output_mode: OutputMode; age_group: AgeGroup;
  age_years: number; participant_count: number; duration: Duration; language: ContentLanguage;
  project_status: ProjectInput["project_status"]; cost_tokens: number;
  regulatory_status: "unverified"; regulatory_note: string; competition_note: string;
};
