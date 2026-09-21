import { describe, expect, it } from "vitest";

import {
  CONTENT_LANGUAGE_CODES,
  CONTENT_LANGUAGE_OPTIONS,
  contentLanguageFromResult,
  normalizeContentLanguage,
} from "./content-languages";

describe("content languages", () => {
  it("exposes every supported generated-content language once", () => {
    expect(CONTENT_LANGUAGE_CODES).toEqual(["kk", "ru", "en", "ky", "uz"]);
    expect(CONTENT_LANGUAGE_OPTIONS.map(({ value }) => value)).toEqual(CONTENT_LANGUAGE_CODES);
  });

  it.each([
    ["kz", "kk"],
    ["kaz", "kk"],
    ["kazakh", "kk"],
    ["rus", "ru"],
    ["russian", "ru"],
    ["ENGLISH", "en"],
    ["kg", "ky"],
    ["kyrgyz", "ky"],
    ["uzbek", "uz"],
    ["O‘ZBEK", "uz"],
    ["OʻZBEKCHA", "uz"],
  ] as const)("normalizes %s to %s", (input, expected) => {
    expect(normalizeContentLanguage(input)).toBe(expected);
  });

  it("does not silently guess an unknown language", () => {
    expect(() => normalizeContentLanguage("de")).toThrow(/Unsupported content language/);
  });

  it("resolves durable result language from direct and nested contracts", () => {
    expect(contentLanguageFromResult({ language: "russian" }, "kk")).toBe("ru");
    expect(contentLanguageFromResult({ meta: { lang: "en" } }, "kk")).toBe("en");
    expect(contentLanguageFromResult({ settings: { language: "uzbek" } }, "kk")).toBe("uz");
    expect(contentLanguageFromResult({ document: { language: "ky" } }, "ru")).toBe("ky");
    expect(contentLanguageFromResult({ language: "de" }, "ru")).toBe("ru");
    expect(contentLanguageFromResult({ request_payload: { content_language: "en" } })).toBe("en");
    expect(contentLanguageFromResult({ title: "legacy material" })).toBeNull();
  });
});
