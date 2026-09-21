export const CONTENT_LANGUAGE_CODES = ["kk", "ru", "en", "ky", "uz"] as const;

export type ContentLanguage = (typeof CONTENT_LANGUAGE_CODES)[number];

export type ContentLanguageOption = {
  value: ContentLanguage;
  label: string;
};

export const CONTENT_LANGUAGE_OPTIONS: readonly ContentLanguageOption[] = [
  { value: "kk", label: "Қазақша" },
  { value: "ru", label: "Русский" },
  { value: "en", label: "English" },
  { value: "ky", label: "Кыргызский" },
  { value: "uz", label: "O‘zbek" },
];

const CONTENT_LANGUAGE_ALIASES: Readonly<Record<string, ContentLanguage>> = {
  kk: "kk",
  kz: "kk",
  kaz: "kk",
  kazakh: "kk",
  "қазақша": "kk",
  "қазақ": "kk",
  "қаз": "kk",
  ru: "ru",
  rus: "ru",
  russian: "ru",
  "русский": "ru",
  "рус": "ru",
  en: "en",
  eng: "en",
  english: "en",
  ky: "ky",
  kg: "ky",
  kyrgyz: "ky",
  "кыргызча": "ky",
  "кыргызский": "ky",
  uz: "uz",
  uzb: "uz",
  uzbek: "uz",
  "o'zbek": "uz",
  "o‘zbek": "uz",
  "o’zbek": "uz",
  "oʻzbek": "uz",
  "o'zbekcha": "uz",
  "o‘zbekcha": "uz",
  "oʻzbekcha": "uz",
  "узбекский": "uz",
  "ўзбекча": "uz",
};

export function normalizeContentLanguage(
  value: string | null | undefined,
  fallback?: ContentLanguage,
): ContentLanguage {
  const normalized = value ? CONTENT_LANGUAGE_ALIASES[value.trim().toLowerCase()] : undefined;
  if (normalized) return normalized;
  if (fallback) return fallback;
  throw new Error(`Unsupported content language: ${String(value)}`);
}

export function contentLanguageLabel(value: string): string {
  const canonical = normalizeContentLanguage(value);
  return CONTENT_LANGUAGE_OPTIONS.find((option) => option.value === canonical)?.label ?? canonical;
}

export function tryNormalizeContentLanguage(
  value: unknown,
): ContentLanguage | null {
  if (typeof value !== "string") return null;
  try {
    return normalizeContentLanguage(value);
  } catch {
    return null;
  }
}

/** Resolve the language persisted by the different durable generator contracts. */
export function contentLanguageFromResult(value: unknown): ContentLanguage | null;
export function contentLanguageFromResult(
  value: unknown,
  fallback: ContentLanguage,
): ContentLanguage;
export function contentLanguageFromResult(
  value: unknown,
  fallback?: ContentLanguage,
): ContentLanguage | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return fallback ?? null;
  const result = value as Record<string, unknown>;
  const direct = tryNormalizeContentLanguage(result.content_language)
    ?? tryNormalizeContentLanguage(result.output_language)
    ?? tryNormalizeContentLanguage(result.language)
    ?? tryNormalizeContentLanguage(result.lang);
  if (direct) return direct;

  for (const key of [
    "meta",
    "metadata",
    "settings",
    "input",
    "request",
    "payload",
    "request_payload",
    "document",
  ] as const) {
    const nested = result[key];
    if (!nested || typeof nested !== "object" || Array.isArray(nested)) continue;
    const record = nested as Record<string, unknown>;
    const language = tryNormalizeContentLanguage(record.content_language)
      ?? tryNormalizeContentLanguage(record.output_language)
      ?? tryNormalizeContentLanguage(record.language)
      ?? tryNormalizeContentLanguage(record.lang);
    if (language) return language;
  }
  return fallback ?? null;
}
