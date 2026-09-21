import type { ContentLanguage } from "@/lib/content-languages";
import type {
  LocalizedLabel,
  PreschoolActivityArea,
  PreschoolActivityDocument,
  PreschoolActivityInput,
  PreschoolConfig,
  PreschoolTask,
} from "./types";

export type PreschoolValidationIssue =
  | "group"
  | "groupName"
  | "teacher"
  | "activity"
  | "topic"
  | "duration"
  | "children"
  | "groups"
  | "styles"
  | "support";

export const MAX_PRESCHOOL_INTEGRATED_AREAS = 5;
export const MAX_PRESCHOOL_STYLES = 8;

export function localizedPreschoolLabel(
  label: LocalizedLabel,
  contentLanguage: ContentLanguage,
  interfaceLanguage: "ru" | "kk",
): string {
  return label[contentLanguage]
    || label[interfaceLanguage]
    || label.kk
    || label.ru
    || Object.values(label).find(Boolean)
    || "";
}

export function areasForAge(areas: PreschoolActivityArea[], age: number): PreschoolActivityArea[] {
  return areas.filter((area) => age >= area.min_age && age <= area.max_age);
}

export function normalizePreschoolInput(input: PreschoolActivityInput): PreschoolActivityInput {
  const activityType = input.activity_type.trim();
  return {
    ...input,
    organization: input.organization.trim(),
    teacher_name: input.teacher_name.trim(),
    group_id: input.group_id.trim(),
    group_name: input.group_name.trim(),
    activity_type: activityType,
    integrated_areas: [...new Set(input.integrated_areas.map((item) => item.trim()).filter(Boolean))]
      .filter((item) => item !== activityType)
      .slice(0, MAX_PRESCHOOL_INTEGRATED_AREAS),
    topic: input.topic.trim(),
    goal: input.goal.trim(),
    styles: [...new Set(input.styles.map((item) => item.trim()).filter(Boolean))]
      .slice(0, MAX_PRESCHOOL_STYLES),
    story_character: input.story_character.trim(),
    support_needs: input.inclusive_enabled
      ? [...new Set(input.support_needs.map((item) => item.trim()).filter(Boolean))]
      : [],
    custom_support_need: input.inclusive_enabled ? input.custom_support_need.trim() : "",
    notes: input.notes.trim(),
  };
}

export function validatePreschoolInput(input: PreschoolActivityInput): PreschoolValidationIssue | null {
  if (!input.group_id || !Number.isInteger(input.age) || input.age < 2 || input.age > 6) return "group";
  if (input.group_name.trim().length < 2) return "groupName";
  if (input.teacher_name.trim().length < 2) return "teacher";
  if (!input.activity_type) return "activity";
  if (input.topic.trim().length < 3) return "topic";
  if (!Number.isInteger(input.duration_minutes) || input.duration_minutes < 10 || input.duration_minutes > 90) return "duration";
  if (!Number.isInteger(input.children_count) || input.children_count < 1 || input.children_count > 60) return "children";
  if (!Number.isInteger(input.group_count) || input.group_count < 1 || input.group_count > 4 || input.group_count > input.children_count) return "groups";
  if (input.styles.length === 0) return "styles";
  if (input.inclusive_enabled && input.support_needs.includes("other") && input.custom_support_need.trim().length < 2) return "support";
  return null;
}

function stringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

export function isPreschoolTask(value: unknown): value is PreschoolTask {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const candidate = value as Partial<PreschoolTask>;
  return typeof candidate.id === "string"
    && typeof candidate.title === "string"
    && typeof candidate.purpose === "string"
    && stringArray(candidate.materials)
    && typeof candidate.teacher_action === "string"
    && typeof candidate.children_action === "string"
    && stringArray(candidate.steps)
    && typeof candidate.result === "string";
}

export function isPreschoolDocument(value: unknown): value is PreschoolActivityDocument {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const candidate = value as Partial<PreschoolActivityDocument>;
  const content = candidate.content;
  return typeof candidate.id === "string"
    && typeof candidate.version === "number"
    && typeof candidate.language === "string"
    && typeof candidate.topic === "string"
    && Boolean(content)
    && typeof content?.title === "string"
    && stringArray(content.objectives)
    && stringArray(content.expected_results)
    && typeof content.story_arc === "string"
    && typeof content.group_division_method === "string"
    && stringArray(content.safety_rules)
    && Array.isArray(content.resources)
    && Array.isArray(content.phases)
    && content.phases.every((phase) =>
      typeof phase.id === "string"
      && typeof phase.title === "string"
      && typeof phase.duration_minutes === "number"
      && stringArray(phase.teacher_script)
      && stringArray(phase.children_actions)
      && stringArray(phase.expected_answers)
      && Array.isArray(phase.tasks)
      && phase.tasks.every(isPreschoolTask),
    );
}

export function documentFromJobResult(result: unknown): PreschoolActivityDocument | null {
  if (isPreschoolDocument(result)) return result;
  if (!result || typeof result !== "object" || Array.isArray(result)) return null;
  const record = result as Record<string, unknown>;
  for (const key of ["document", "activity", "preschool_activity"]) {
    if (isPreschoolDocument(record[key])) return record[key];
  }
  return null;
}

export function topicsFromJobResult(result: unknown): string[] {
  const value = result && typeof result === "object" && !Array.isArray(result)
    ? (result as Record<string, unknown>).topics
    : result;
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0).slice(0, 10);
}

export function taskIntegrationHref(
  target: "visual" | "builder" | "video",
  prompt: string,
  language: ContentLanguage,
): string {
  const cleanPrompt = prompt.replace(/\s+/g, " ").trim().slice(0, 4000);
  const params = new URLSearchParams({ prompt: cleanPrompt, language });
  if (target === "builder") params.set("type", "game");
  if (target === "visual") return `/dashboard/ai/kornekilik?${params.toString()}`;
  if (target === "video") return `/dashboard/media/video?${params.toString()}`;
  return `/dashboard/ai/builder?${params.toString()}`;
}

const BUILDER_FALLBACK_PREFIX: Record<ContentLanguage, string> = {
  kk: "Мектеп жасына дейінгі балаларға арналған интерактивті ойын жаса",
  ru: "Создай интерактивную игру для дошкольников",
  en: "Create an interactive game for preschool children",
  ky: "Мектепке чейинки балдар үчүн интерактивдүү оюн түз",
  uz: "Maktabgacha yoshdagi bolalar uchun interaktiv o‘yin yarat",
};

export function taskVisualPrompt(task: PreschoolTask): string {
  return task.visual_prompt?.trim()
    || [task.title, task.purpose, ...task.steps].filter(Boolean).join(". ");
}

export function taskBuilderPrompt(task: PreschoolTask, language: ContentLanguage): string {
  return task.builder_prompt?.trim()
    || `${BUILDER_FALLBACK_PREFIX[language]}: ${[task.title, task.children_action, ...task.steps].filter(Boolean).join(". ")}`;
}

export function safePreschoolFileName(topic: string, extension: "docx" | "pdf"): string {
  const stem = topic.trim().replace(/[\\/:*?"<>|]+/g, "-").replace(/\s+/g, "_").slice(0, 72) || "preschool_activity";
  return `${stem}.${extension}`;
}

export function defaultPreschoolInput(
  config: PreschoolConfig,
  language: ContentLanguage,
): PreschoolActivityInput {
  const group = config.age_groups[0];
  const age = group?.age ?? 2;
  const area = areasForAge(config.activity_areas, age)[0];
  return {
    organization: "",
    teacher_name: config.teacher_name || "",
    group_id: group?.id ?? "",
    group_name: group ? localizedPreschoolLabel(group.label, language, language === "kk" ? "kk" : "ru") : "",
    age,
    activity_type: area?.id ?? "",
    integrated_areas: [],
    topic: "",
    goal: "",
    duration_minutes: config.duration_options.includes(20) ? 20 : (config.duration_options[0] ?? 20),
    children_count: 20,
    group_count: 1,
    styles: config.styles[0]?.id ? [config.styles[0].id] : [],
    wow_enabled: true,
    story_character: "",
    national_values: false,
    inclusive_enabled: false,
    support_needs: [],
    custom_support_need: "",
    teacher_script: true,
    expected_answers: true,
    output_format: "full",
    language,
    notes: "",
  };
}
