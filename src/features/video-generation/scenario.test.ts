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
