import { describe, expect, it } from "vitest";

import { contentLanguageForGenerationJob } from "./generation-download";


describe("generation download content language", () => {
  it("prefers the language recovered from the durable request", () => {
    expect(contentLanguageForGenerationJob({
      content_language: "ru",
      result: { language: "kk", title: "Сохранённый материал" },
    })).toBe("ru");
  });

  it("uses persisted result metadata for older response contracts", () => {
    expect(contentLanguageForGenerationJob({
      content_language: null,
      result: { settings: { language: "uz" } },
    })).toBe("uz");
  });

  it("does not substitute an unrelated interface language for unknown legacy output", () => {
    expect(contentLanguageForGenerationJob({
      content_language: null,
      result: { title: "Legacy output without language metadata" },
    })).toBeNull();
  });
});
