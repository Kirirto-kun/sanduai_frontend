import type { ContentLanguage } from "@/lib/content-languages";

export type CoachingInput = {
  topic: string; audience: string; duration_minutes: number; participant_count: number;
  group_count: number; format: "offline" | "online" | "hybrid"; goal: string;
  resources: string[]; experience: string; methods: string[]; include_ai: boolean;
  language: ContentLanguage; notes: string; defaults_accepted: boolean;
};
export type StageKind = "organization" | "engagement" | "theory" | "grouping" | "practice" | "energizer" | "application" | "reflection" | "closing";
export type CoachingStage = {
  kind: StageKind; title: string; method: string; purpose: string; host_script: string;
  participant_action: string; transition: string; expected_result: string; materials: string[];
  duration_minutes: number; participant_minutes: number; start_minute: number; end_minute: number;
};
export type PracticalTask = {
  kind: "analysis" | "creation" | "presentation"; title: string; method: string;
  purpose: string; host_script: string; participant_action: string; product_example: string;
  materials: string[]; steps: string[]; criteria: string[]; duration_minutes: number;
};
export type CoachingResult = {
  topic: string; audience: string; duration_minutes: number; participant_count: number;
  group_count: number; format: CoachingInput["format"]; language: ContentLanguage; cost_tokens: number;
  title: string; goal: string; assumptions: string[]; objectives: string[]; outcomes: string[];
  materials: string[]; preparation: string[]; concept: { name: string; description: string; final_product: string };
  grouping: { method: string; instructions: string; groups: { name: string; task: string; expected_result: string }[] };
  stages: CoachingStage[]; practical_tasks: PracticalTask[];
  handouts: { kind: "grouping" | "task" | "case" | "reflection" | "evaluation" | "qr"; title: string; instructions: string; content: string }[];
  slides: { number: number; title: string; on_screen: string; speaker_notes: string; visual: string; participant_action: string }[];
  reflection: { title: string; instructions: string; host_script: string; questions: string[] };
  evaluation: { criterion: string; evidence: string }[]; closing_script: string;
  adaptations: { situation: string; instruction: string }[];
  national_values: { value: string; action: string }[];
  ai_tools: { name: string; purpose: string; prompt: string; offline_alternative: string; critical_check: string }[];
  quality_checks: { code: string; passed: boolean }[]; participant_activity_percent: number;
};
