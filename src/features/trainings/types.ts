import type { ContentLanguage } from "@/lib/content-languages";

export type EventType = "psychological_training" | "creative_seminar" | "masterclass" | "teambuilding" | "strategic_session" | "student_training";
export type OutputMode = "ideas" | "full_scenario" | "masterclass" | "games" | "handouts" | "presentation_plan" | "full_package" | "express";
export type TrainingInput = {
  topic: string; event_type: EventType; output_mode: OutputMode; audience: string;
  participant_count: number; duration_minutes: number; age_group: string;
  format: "offline" | "online" | "hybrid"; experience: string; goal: string;
  venue: string; expected_result: string; accessibility_notes: string; notes: string;
  materials: string[]; digital_tools: string[]; creativity: "balanced" | "bold" | "restrained";
  language: ContentLanguage; include_ai: boolean;
};
export type Exercise = {
  title: string; purpose: string; duration_minutes: number; materials: string[];
  organization: string; host_script: string; instructions: string; steps: string[];
  rules: string[]; tasks: string[]; questions: string[]; example_answers: string[];
  expected_result: string; transition: string; accessibility_alternative: string;
};
export type TrainingStage = Exercise & { id: string; start_minute: number; end_minute: number };
export type TrainingResult = {
  title: string; topic: string; event_type: EventType; output_mode: OutputMode;
  audience: string; participant_count: number; duration_minutes: number;
  format: string; language: ContentLanguage; cost_tokens: number; assumptions: string[];
  goal: string; objectives: string[]; outcomes: string[]; methods: string[]; materials: string[];
  preparation: string[]; safety_principles: string[]; safety_note: string; grouping: string;
  concept: { name: string; rationale: string; final_product: string };
  stages: TrainingStage[]; ideas: { title: string; goal: string; mechanic: string; expected_result: string }[];
  games: Exercise[]; handouts: { title: string; instructions: string; content: string }[];
  slides: { number: number; title: string; on_screen: string; visual: string; speaker_notes: string; participant_action: string }[];
  practical_result: string; closing_script: string;
  reflection: { title: string; instructions: string; host_script: string; questions: string[] } | null;
  evaluation: { criterion: string; evidence: string }[]; feedback_questions: string[];
  adaptations: { situation: string; instruction: string }[];
  ai_prompts: { title: string; prompt: string; critical_check: string }[];
};
