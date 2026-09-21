import { CONTENT_LANGUAGE_OPTIONS } from "@/lib/content-languages";
import type { BuilderContentLanguage } from "./types";

export const BUILDER_CONTENT_LANGUAGES: readonly BuilderContentLanguage[] = [
  "auto",
  ...CONTENT_LANGUAGE_OPTIONS.map(option => option.value),
];

export function isBuilderContentLanguage(value: unknown): value is BuilderContentLanguage {
  return typeof value === "string"
    && BUILDER_CONTENT_LANGUAGES.includes(value as BuilderContentLanguage);
}

export function availableBuilderContentLanguages(
  configured?: readonly BuilderContentLanguage[],
): BuilderContentLanguage[] {
  const available = configured
    ? BUILDER_CONTENT_LANGUAGES.filter(language => configured.includes(language))
    : [];
  return available.length > 0 ? available : [...BUILDER_CONTENT_LANGUAGES];
}

export function normalizeBuilderContentLanguage(
  value: unknown,
  available: readonly BuilderContentLanguage[] = BUILDER_CONTENT_LANGUAGES,
): BuilderContentLanguage {
  if (isBuilderContentLanguage(value) && available.includes(value)) return value;
  if (available.includes("auto")) return "auto";
  return available[0] ?? "auto";
}

export function builderContentLanguageLabel(
  value: BuilderContentLanguage,
  interfaceLanguage: "ru" | "kk",
): string {
  if (value === "auto") {
    return interfaceLanguage === "kk" ? "Авто · сұрау тілі" : "Авто · язык запроса";
  }
  return CONTENT_LANGUAGE_OPTIONS.find(option => option.value === value)?.label ?? value;
}

export function compactBuilderContentLanguageLabel(
  value: BuilderContentLanguage,
): string {
  return value === "auto"
    ? "Авто"
    : CONTENT_LANGUAGE_OPTIONS.find(option => option.value === value)?.label ?? value;
}
