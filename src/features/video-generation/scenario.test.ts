import { describe, expect, it } from "vitest";
import {
  nearestScenarioDuration,
  scenarioDurationOptions,
  scenarioPrompt,
} from "./scenario";

describe("AI scenario preparation", () => {
  it("puts legacy dialogue in the visible editable prompt without duplicating it", () => {
    const scene = {
      title: "Wedding",
      prompt: "Клубника и банан идут по улице.",
      dialogue: "Клубника: «Хочу шикарную свадьбу!»",
    };
    const prompt = scenarioPrompt(scene);
    expect(prompt).toContain(scene.dialogue);
    expect(scenarioPrompt({ ...scene, prompt })).toBe(prompt);
  });

  it("does not repeat quoted speech just because its speaker label is formatted differently", () => {
    const prompt =
      "Клубника идёт рядом с бананом и говорит: «Хочу шикарную свадьбу!»";
    expect(
      scenarioPrompt({
        title: "Wedding",
        prompt,
        dialogue: "Клубника: «Хочу шикарную свадьбу!»",
      }),
    ).toBe(prompt);
  });

  it("keeps additional directions, unquoted lines and missing speaker assignments", () => {
    const prompt = "Банан говорит: «Хочу шикарную свадьбу!»";
    const extra =
      "Банан: «Хочу шикарную свадьбу!»\nКлубника смеётся и обнимает банан.";
    expect(
      scenarioPrompt({ title: "Wedding", prompt, dialogue: extra }),
    ).toContain(extra);
    const speaker = "Клубника: «Хочу шикарную свадьбу!»";
    expect(
      scenarioPrompt({ title: "Wedding", prompt, dialogue: speaker }),
    ).toContain(speaker);
  });

  it("respects sparse model durations and count when offering total lengths", () => {
    expect(scenarioDurationOptions([5, 10], 2)).toEqual([10, 15, 20]);
    expect(
      nearestScenarioDuration(scenarioDurationOptions([5, 10], 2), 12),
    ).toBe(10);
    expect(scenarioDurationOptions([5], 3)).toEqual([15]);
  });

  it("rejects invalid counts and limits project duration", () => {
    expect(scenarioDurationOptions([5], 0)).toEqual([]);
    expect(scenarioDurationOptions([5], 1.5)).toEqual([]);
    expect(scenarioDurationOptions([5], 21)).toEqual([]);
    expect(scenarioDurationOptions([15, 20], 20)).toEqual([300]);
  });
});
