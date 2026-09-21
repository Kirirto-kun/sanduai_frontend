import { tryNormalizeContentLanguage, type ContentLanguage } from "./content-languages";

type SearchParamsReader = { get(name: string): string | null };

export type IntegrationPrefill = {
  prompt: string;
  language: ContentLanguage | null;
  type: string | null;
};

/** Keep hand-off URLs useful while bounding untrusted query-string input. */
export function readIntegrationPrefill(searchParams: SearchParamsReader): IntegrationPrefill {
  const prompt = (searchParams.get("prompt") ?? "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .trim()
    .slice(0, 4_000);
  const rawType = searchParams.get("type")?.trim().toLowerCase() || null;
  return {
    prompt,
    language: tryNormalizeContentLanguage(searchParams.get("language")),
    type: rawType && /^[a-z0-9_-]{1,40}$/.test(rawType) ? rawType : null,
  };
}
