import { describe, expect, it } from "vitest";
import { DEFAULT_VIDEO_SETTINGS } from "./model";
import { normalizeVideoPromptDraft } from "./prompt-draft";

function draft(prompt = "Клубника и банан идут по улице.") {
  return {
    title: "Свадьба",
    prompt,
    original_prompt: prompt,
    dialogue: "",
    settings: { ...DEFAULT_VIDEO_SETTINGS },
    input_asset_id: "image-1",
  };
}

describe("visible legacy video dialogue migration", () => {
  it("moves exact words and speaker assignments into the visible prompt before clearing hidden fields", () => {
    const original = draft();
    original.dialogue = "Клубника: «Хочу шикарную свадьбу!»";
    original.settings.speech_text = "Әлия, бүгін 25 қазан.";
    const migrated = normalizeVideoPromptDraft(original);
    expect(migrated.prompt).toBe(
      "Клубника и банан идут по улице.\n\nРеплики персонажей:\nКлубника: «Хочу шикарную свадьбу!»\n\nРеплики дословно:\nӘлия, бүгін 25 қазан.",
    );
    expect(migrated.dialogue).toBe("");
    expect(migrated.settings.speech_text).toBe("");
    expect(original.dialogue).toBe("Клубника: «Хочу шикарную свадьбу!»");
    expect(migrated.original_prompt).toBe(original.original_prompt);
    expect(migrated.input_asset_id).toBe("image-1");
  });

  it("does not duplicate a visible quote or add a heading for an already represented speaker", () => {
    const original = draft(
      "Клубника идёт рядом с бананом и говорит: «Хочу шикарную свадьбу!»",
    );
    original.dialogue = "Клубника: «Хочу шикарную свадьбу!»";
    original.settings.speech_text = "Хочу шикарную свадьбу!";
    expect(normalizeVideoPromptDraft(original).prompt).toBe(original.prompt);
  });

  it("preserves different speakers saying the same words and keeps action directions", () => {
    const original = draft("Банан говорит: «Да!»");
    original.dialogue = "Клубника: «Да!»\nКлубника обнимает банан.";
    const migrated = normalizeVideoPromptDraft(original);
    expect(migrated.prompt).toContain(original.dialogue);
    expect(migrated.prompt).toContain("Банан говорит: «Да!»");
  });

  it("is idempotent and appends no repeated text when both legacy fields contain one line", () => {
    const original = draft();
    original.dialogue = "Клубника: «Хочу шикарную свадьбу!»";
    original.settings.speech_text = "Хочу шикарную свадьбу!";
    const migrated = normalizeVideoPromptDraft(original);
    expect(migrated.prompt.match(/Хочу шикарную свадьбу!/g)).toHaveLength(1);
    expect(normalizeVideoPromptDraft(migrated)).toEqual(migrated);
  });

  it("keeps technical choices and unchanged prompt whitespace when no legacy speech exists", () => {
    const original = draft("  Свой сценарий.\n");
    original.settings = {
      ...original.settings,
      model_id: "minimax/h3-max",
      resolution: "768p",
      duration: 9,
      aspect_ratio: "9:16",
      speech_language: "kk",
      generate_audio: false,
      style: "presenter",
    };
    const migrated = normalizeVideoPromptDraft(original);
    expect(migrated.prompt).toBe(original.prompt);
    expect(migrated.settings).toMatchObject({
      model_id: "minimax/h3-max",
      resolution: "768p",
      duration: 9,
      aspect_ratio: "9:16",
      speech_language: "kk",
      generate_audio: true,
      style: "",
    });
  });

  it("does not truncate words when a migrated draft exceeds the request limit", () => {
    const original = draft("С".repeat(12000));
    original.settings.speech_text = "Әлия: «Соңғы сөз сақталсын.»";
    const migrated = normalizeVideoPromptDraft(original);
    expect(migrated.prompt.length).toBeGreaterThan(12000);
    expect(migrated.prompt.endsWith(original.settings.speech_text)).toBe(true);
  });
});
