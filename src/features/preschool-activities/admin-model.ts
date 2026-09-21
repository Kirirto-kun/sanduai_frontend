import type { ContentLanguage } from "@/lib/content-languages";
import type { LocalizedLabel, PreschoolAdminSettings } from "./types";

export const PRESCHOOL_PROFILE_LANGUAGES = ["kk", "ru", "en", "ky", "uz"] as const satisfies readonly ContentLanguage[];

export type PreschoolAdminValidationIssue =
  | "standard_version"
  | "regulatory_notes"
  | "model"
  | "prompt"
  | "costs"
  | "durations"
  | "ids"
  | "ages"
  | "ranges"
  | "labels"
  | "profile";

export function completeLocalizedProfile(
  value: LocalizedLabel | undefined,
  fallback = "",
): LocalizedLabel {
  return Object.fromEntries(
    PRESCHOOL_PROFILE_LANGUAGES.map((language) => [language, value?.[language] ?? fallback]),
  ) as LocalizedLabel;
}

function hasAllLanguages(value: LocalizedLabel): boolean {
  return PRESCHOOL_PROFILE_LANGUAGES.every((language) => Boolean(value[language]?.trim()));
}

export function validatePreschoolAdminSettings(
  settings: PreschoolAdminSettings,
): PreschoolAdminValidationIssue | null {
  if (!settings.standard_version.trim()) return "standard_version";
  if (!hasAllLanguages(settings.regulatory_notes)) return "regulatory_notes";
  if (!settings.model.trim()) return "model";
  if (settings.prompt.trim().length < 50) return "prompt";
  if (![settings.token_cost, settings.task_token_cost, settings.topic_token_cost]
    .every((value) => Number.isInteger(value) && value >= 1)) return "costs";
  if (settings.duration_options.length === 0
    || settings.duration_options.some((value) => !Number.isInteger(value) || value < 10 || value > 90)) return "durations";

  const labelCollections = [settings.age_groups, settings.activity_areas, settings.styles, settings.support_needs];
  const profileCollections = [settings.main_objectives, settings.program_requirements];
  const allCollections = [...labelCollections, ...profileCollections];
  if (allCollections.some((items) => items.length === 0 || new Set(items.map((item) => item.id)).size !== items.length)) return "ids";
  if (settings.age_groups.some((item) => !Number.isInteger(item.age) || item.age < 2 || item.age > 6)) return "ages";
  if (settings.activity_areas.some((item) => item.min_age < 2 || item.max_age > 6 || item.min_age > item.max_age)) return "ranges";
  if (labelCollections.some((items) => items.some((item) => !hasAllLanguages(item.label)))) return "labels";
  if (profileCollections.some((items) => items.some((item) => !hasAllLanguages(item.label) || !hasAllLanguages(item.content)))) return "profile";
  return null;
}
