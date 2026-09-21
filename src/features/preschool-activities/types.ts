import type { ContentLanguage } from "@/lib/content-languages";

export type LocalizedLabel = Partial<Record<ContentLanguage, string>>;

export type PreschoolAgeGroup = {
  id: string;
  label: LocalizedLabel;
  age: number;
};

export type PreschoolActivityArea = {
  id: string;
  label: LocalizedLabel;
  min_age: number;
  max_age: number;
};

export type PreschoolStyle = {
  id: string;
  label: LocalizedLabel;
};

export type PreschoolSupportNeed = {
  id: string;
  label: LocalizedLabel;
};

export type PreschoolProfileEntry = {
  id: string;
  label: LocalizedLabel;
  content: LocalizedLabel;
};

export type PreschoolConfig = {
  standard_version: string;
  regulatory_note: string;
  regulatory_notes: LocalizedLabel;
  main_objectives: PreschoolProfileEntry[];
  program_requirements: PreschoolProfileEntry[];
  age_groups: PreschoolAgeGroup[];
  activity_areas: PreschoolActivityArea[];
  styles: PreschoolStyle[];
  support_needs: PreschoolSupportNeed[];
  languages: Array<{ code: ContentLanguage | string; label: string }>;
  duration_options: number[];
  token_cost: number;
  task_token_cost: number;
  topic_token_cost: number;
  teacher_name: string;
};

export type PreschoolAdminSettings = PreschoolConfig & {
  prompt: string;
  model: string;
  updated_at: string | null;
};

export type PreschoolAdminSettingsUpdate = Omit<
  PreschoolAdminSettings,
  "teacher_name" | "updated_at"
>;

export type PreschoolOutputFormat = "short" | "full";
export type PreschoolGroupCount = 1 | 2 | 3 | 4;

export type PreschoolActivityInput = {
  organization: string;
  teacher_name: string;
  group_id: string;
  group_name: string;
  age: number;
  activity_type: string;
  integrated_areas: string[];
  topic: string;
  goal: string;
  duration_minutes: number;
  children_count: number;
  group_count: PreschoolGroupCount;
  styles: string[];
  wow_enabled: boolean;
  story_character: string;
  national_values: boolean;
  inclusive_enabled: boolean;
  support_needs: string[];
  custom_support_need: string;
  teacher_script: boolean;
  expected_answers: boolean;
  output_format: PreschoolOutputFormat;
  language: ContentLanguage;
  notes: string;
};

export type PreschoolResource = {
  item: string;
  quantity?: number | null;
  unit?: string | null;
  notes?: string | null;
};

export type PreschoolExperiment = {
  need: string[];
  do: string[];
  observe: string;
  conclusion: string;
};

export type PreschoolSteamCycle = {
  problem: string;
  child_choice: string;
  build: string;
  test: string;
  improve: string;
};

export type PreschoolTask = {
  id: string;
  title: string;
  purpose: string;
  materials: string[];
  teacher_action: string;
  children_action: string;
  steps: string[];
  result: string;
  safety?: string | null;
  inclusion_support?: string[];
  experiment?: PreschoolExperiment | null;
  steam?: PreschoolSteamCycle | null;
  visual_prompt?: string | null;
  video_query?: string | null;
  builder_prompt?: string | null;
};

export type PreschoolPhase = {
  id: string;
  kind: string;
  title: string;
  duration_minutes: number;
  narrative?: string | null;
  teacher_script: string[];
  children_actions: string[];
  expected_answers: string[];
  tasks: PreschoolTask[];
  reflection?: string | null;
};

export type PreschoolActivityContent = {
  title: string;
  goal: string;
  objectives: string[];
  expected_results: string[];
  resources: PreschoolResource[];
  preliminary_work: string[];
  story_arc: string;
  group_division_method: string;
  safety_rules: string[];
  praise_reward?: string | null;
  phases: PreschoolPhase[];
  total_duration_minutes: number;
};

export type PreschoolActivityDocument = PreschoolActivityInput & {
  id: string;
  activity_type_label?: string;
  integrated_area_labels?: string[];
  style_labels?: string[];
  content: PreschoolActivityContent;
  standard_version: string;
  regulatory_note?: string;
  token_cost: number;
  created_at: string;
  updated_at: string;
  version: number;
};

export type PreschoolActivitySummary = Omit<PreschoolActivityDocument, "content"> & {
  title?: string;
};

export type PreschoolTaskAction =
  | "regenerate"
  | "more_interesting"
  | "simplify"
  | "complicate"
  | "convert_to_steam"
  | "other";

export type PreschoolTopicsResult = { topics: string[] };
