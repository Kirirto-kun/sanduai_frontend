import { describe, expect, it } from "vitest";

import {
  areasForAge,
  documentFromJobResult,
  localizedPreschoolLabel,
  MAX_PRESCHOOL_INTEGRATED_AREAS,
  MAX_PRESCHOOL_STYLES,
  normalizePreschoolInput,
  taskBuilderPrompt,
  taskIntegrationHref,
  taskVisualPrompt,
  topicsFromJobResult,
  validatePreschoolInput,
} from "./model";
import type { PreschoolActivityDocument, PreschoolActivityInput, PreschoolTask } from "./types";

const input: PreschoolActivityInput = {
  organization: "  Garden  ", teacher_name: " Teacher ", group_id: "middle", group_name: " Group ", age: 3,
  activity_type: "speech", integrated_areas: ["music", "speech", "music"], topic: " Water ", goal: " Explore ",
  duration_minutes: 20, children_count: 18, group_count: 2, styles: ["quest", "quest"], wow_enabled: true,
  story_character: " Drop ", national_values: false, inclusive_enabled: true, support_needs: ["speech", "speech"],
  custom_support_need: " ", teacher_script: true, expected_answers: true, output_format: "full", language: "en", notes: " Note ",
};

const task: PreschoolTask = {
  id: "task-1", title: "Build a bridge", purpose: "Explore balance", materials: ["blocks"],
  teacher_action: "Offer a problem", children_action: "Choose blocks and build", steps: ["Choose", "Build", "Test"], result: "A tested bridge",
};

const document: PreschoolActivityDocument = {
  ...input,
  id: "activity-1", standard_version: "2026.1", token_cost: 20, version: 1,
  created_at: "2026-09-21T00:00:00Z", updated_at: "2026-09-21T00:00:00Z",
  content: {
    title: "Water adventure", goal: "Explore water", objectives: ["Name one property"], expected_results: ["Child explains an observation"],
    resources: [{ item: "Cup", quantity: 18, unit: "pcs", notes: "plastic" }], preliminary_work: ["Prepare tables"],
    story_arc: "A drop asks children for help.", group_division_method: "Choose a coloured drop", safety_rules: ["Teacher handles hot water"], praise_reward: "Water explorer badge",
    phases: Array.from({ length: 9 }, (_, index) => ({
      id: `phase-${index}`, kind: `phase_${index}`, title: `Stage ${index + 1}`, duration_minutes: index < 2 ? 3 : 2,
      teacher_script: [], children_actions: ["Observe"], expected_answers: [], tasks: index === 3 ? [{ ...task, inclusion_support: ["Use large blocks"], experiment: { need: ["cup"], do: ["pour"], observe: "level", conclusion: "water flows" }, steam: { problem: "cross", child_choice: "blocks", build: "bridge", test: "toy", improve: "strengthen" } }] : [],
    })),
    total_duration_minutes: 20,
  },
};

describe("preschool activity model", () => {
  it("filters activity areas by the selected age", () => {
    const areas = [
      { id: "young", label: { en: "Young" }, min_age: 2, max_age: 3 },
      { id: "older", label: { en: "Older" }, min_age: 4, max_age: 5 },
    ];
    expect(areasForAge(areas, 3).map((area) => area.id)).toEqual(["young"]);
  });

  it("prefers the selected content language and has safe fallbacks", () => {
    const label = { kk: "Сөйлеу", ru: "Речь", en: "Speech" };
    expect(localizedPreschoolLabel(label, "en", "ru")).toBe("Speech");
    expect(localizedPreschoolLabel({ kk: "Музыка" }, "uz", "ru")).toBe("Музыка");
  });

  it("normalizes arrays and prevents the main area from being duplicated", () => {
    const normalized = normalizePreschoolInput({ ...input, activity_type: " speech " });
    expect(normalized.organization).toBe("Garden");
    expect(normalized.integrated_areas).toEqual(["music"]);
    expect(normalized.styles).toEqual(["quest"]);
    expect(normalized.support_needs).toEqual(["speech"]);
    expect(validatePreschoolInput(normalized)).toBeNull();
  });

  it("validates custom support and duration", () => {
    expect(validatePreschoolInput({ ...input, support_needs: ["other"], custom_support_need: "" })).toBe("support");
    expect(validatePreschoolInput({ ...input, duration_minutes: 5 })).toBe("duration");
    expect(validatePreschoolInput({ ...input, children_count: 2, group_count: 3 })).toBe("groups");
  });

  it("caps backend-limited selections and clears disabled inclusion atomically", () => {
    const normalized = normalizePreschoolInput({
      ...input,
      integrated_areas: Array.from({ length: 9 }, (_, index) => `area-${index}`),
      styles: Array.from({ length: 12 }, (_, index) => `style-${index}`),
      inclusive_enabled: false,
      support_needs: ["speech", "other"],
      custom_support_need: "Individual prompt",
    });
    expect(normalized.integrated_areas).toHaveLength(MAX_PRESCHOOL_INTEGRATED_AREAS);
    expect(normalized.styles).toHaveLength(MAX_PRESCHOOL_STYLES);
    expect(normalized.support_needs).toEqual([]);
    expect(normalized.custom_support_need).toBe("");
  });

  it("accepts a complete document with safety, experiment and STEAM details", () => {
    expect(documentFromJobResult({ document })).toEqual(document);
    expect(topicsFromJobResult({ topics: ["One", "", 4, "Two"] })).toEqual(["One", "Two"]);
  });

  it("builds internal integration links and deterministic legacy fallbacks", () => {
    expect(taskVisualPrompt(task)).toContain("Build a bridge");
    expect(taskBuilderPrompt(task, "ru")).toContain("Создай интерактивную игру");
    expect(taskIntegrationHref("video", "water & light", "en")).toBe("/dashboard/media/video?prompt=water+%26+light&language=en");
    expect(taskIntegrationHref("builder", "drag cards", "en")).toContain("type=game");
    expect(taskIntegrationHref("visual", "<script>alert(1)</script>", "en")).toContain("%3Cscript%3E");
  });
});
