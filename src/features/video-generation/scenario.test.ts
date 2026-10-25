import { describe, expect, it } from "vitest";
import {
  nearestScenarioDuration,
  scenarioCapacity,
  scenarioDurationOptions,
  scenarioPrompt,
} from "./scenario";
import type { VideoPlan, VideoScene } from "./types";

const limits = { max_scenes: 20, max_project_duration: 300 };
function savedScene(id: string, duration = 5): VideoScene {
  return {
    id,
    included: true,
    settings: { duration },
    versions: [],
  } as unknown as VideoScene;
}
const twoScenes = {
  title: "Wedding",
  script: "Two shots",
  characters: "",
  visual_style: "",
  audio_notes: "",
  scenes: [
    { title: "First", prompt: "Клубника и банан идут.", duration: 5 },
    { title: "Second", prompt: "Клубника и банан едят хлеб.", duration: 5 },
  ],
} satisfies VideoPlan;

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

  it("can resume a partial apply at the scene limit before and after a query refresh", () => {
    const existing = Array.from({ length: 18 }, (_, i) =>
      savedScene(`old-${i}`),
    );
    const beforeRefresh = scenarioCapacity(
      { scenes: existing },
      twoScenes,
      ["new-0"],
      limits,
    );
    const afterRefresh = scenarioCapacity(
      { scenes: [...existing, savedScene("new-0")] },
      twoScenes,
      ["new-0"],
      limits,
    );
    expect(beforeRefresh).toEqual(afterRefresh);
    expect(afterRefresh).toMatchObject({
      remainingScenes: 1,
      remainingDuration: 205,
      fits: true,
    });
  });

  it("checks pending scenes against the project's existing duration", () => {
    const existing = Array.from({ length: 18 }, (_, i) =>
      savedScene(`old-${i}`, 15),
    );
    const planned = {
      ...twoScenes,
      scenes: twoScenes.scenes.map((scene) => ({ ...scene, duration: 15 })),
    };
    expect(
      scenarioCapacity({ scenes: existing }, planned, [], limits),
    ).toMatchObject({ remainingDuration: 30, fits: true });
    const filled = [...existing, savedScene("other", 5)];
    expect(
      scenarioCapacity({ scenes: filled }, planned, [], limits),
    ).toMatchObject({ remainingDuration: 25, fits: false });
  });

  it("uses actual selected clip duration and excludes omitted clips from duration only", () => {
    const ready = savedScene("ready", 5);
    ready.selected_version_id = "version";
    ready.versions = [
      { id: "version", asset: { duration: 7.3 } },
    ] as VideoScene["versions"];
    const omitted = { ...savedScene("omitted", 15), included: false };
    const capacity = scenarioCapacity(
      { scenes: [ready, omitted] },
      twoScenes,
      [],
      { max_scenes: 4, max_project_duration: 17 },
    );
    expect(capacity.remainingScenes).toBe(2);
    expect(capacity.remainingDuration).toBeCloseTo(9.7);
    expect(capacity.fits).toBe(false);
  });
});
