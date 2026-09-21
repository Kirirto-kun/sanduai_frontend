import { describe, expect, it } from "vitest";

import {
  availableBuilderContentLanguages,
  BUILDER_CONTENT_LANGUAGES,
  builderContentLanguageLabel,
  compactBuilderContentLanguageLabel,
  normalizeBuilderContentLanguage,
} from "./language";

describe("Builder content languages", () => {
  it("keeps the backend contract order and all five explicit languages", () => {
    expect(BUILDER_CONTENT_LANGUAGES).toEqual(["auto", "kk", "ru", "en", "ky", "uz"]);
  });

  it("uses configured languages in canonical order and falls back safely", () => {
    expect(availableBuilderContentLanguages(["uz", "auto", "ru"])).toEqual(["auto", "ru", "uz"]);
    expect(availableBuilderContentLanguages([])).toEqual(BUILDER_CONTENT_LANGUAGES);
    expect(normalizeBuilderContentLanguage("ky", ["auto", "ky"])).toBe("ky");
    expect(normalizeBuilderContentLanguage("de", ["auto", "ru"])).toBe("auto");
    expect(normalizeBuilderContentLanguage("auto", ["kk", "ru"])).toBe("kk");
  });

  it("labels auto for the interface and keeps native language names", () => {
    expect(builderContentLanguageLabel("auto", "ru")).toBe("Авто · язык запроса");
    expect(builderContentLanguageLabel("auto", "kk")).toBe("Авто · сұрау тілі");
    expect(builderContentLanguageLabel("ky", "ru")).toBe("Кыргызский");
    expect(builderContentLanguageLabel("uz", "kk")).toBe("O‘zbek");
    expect(compactBuilderContentLanguageLabel("auto")).toBe("Авто");
    expect(compactBuilderContentLanguageLabel("en")).toBe("English");
  });
});
