import { describe, expect, it } from "vitest";

import { avatarLanguageOptions } from "./avatar-language";

describe("Ybyrai avatar languages", () => {
  it("offers auto and every supported content language", () => {
    expect(avatarLanguageOptions("ru").map(({ value }) => value)).toEqual([
      "auto",
      "kk",
      "ru",
      "en",
      "ky",
      "uz",
    ]);
  });

  it("uses shared self-language names and localizes auto", () => {
    expect(avatarLanguageOptions("ru").map(({ label }) => label)).toEqual([
      "Авто",
      "Қазақша",
      "Русский",
      "English",
      "Кыргызский",
      "O‘zbek",
    ]);
    expect(avatarLanguageOptions("kk")[0]).toEqual({
      value: "auto",
      label: "Автоматты",
    });
  });
});
