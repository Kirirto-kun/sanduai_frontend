import { describe, expect, it } from "vitest";

import { completeLocalizedProfile, validatePreschoolAdminSettings } from "./admin-model";
import type { LocalizedLabel, PreschoolAdminSettings } from "./types";

const localized = (value: string): LocalizedLabel => ({
  kk: `${value} kk`,
  ru: `${value} ru`,
  en: `${value} en`,
  ky: `${value} ky`,
  uz: `${value} uz`,
});

const settings: PreschoolAdminSettings = {
  standard_version: "2026.1",
  regulatory_note: "note kk",
  regulatory_notes: localized("note"),
  main_objectives: [{ id: "objective", label: localized("objective"), content: localized("objective content") }],
  program_requirements: [{ id: "requirement", label: localized("requirement"), content: localized("requirement content") }],
  age_groups: [{ id: "middle", label: localized("group"), age: 3 }],
  activity_areas: [{ id: "speech", label: localized("speech"), min_age: 2, max_age: 6 }],
  styles: [{ id: "story", label: localized("story") }],
  support_needs: [{ id: "speech", label: localized("support") }],
  languages: [{ code: "kk", label: "Қазақша" }],
  duration_options: [15, 20],
  token_cost: 20,
  task_token_cost: 5,
  topic_token_cost: 2,
  teacher_name: "Teacher",
  prompt: "A sufficiently detailed system prompt for preschool activity generation.",
  model: "test-model",
  updated_at: null,
};

describe("preschool admin profile", () => {
  it("requires every localized regulatory and profile field", () => {
    expect(validatePreschoolAdminSettings(settings)).toBeNull();
    expect(validatePreschoolAdminSettings({
      ...settings,
      regulatory_notes: { ...settings.regulatory_notes, uz: "" },
    })).toBe("regulatory_notes");
    expect(validatePreschoolAdminSettings({
      ...settings,
      main_objectives: [{ ...settings.main_objectives[0], content: { ...settings.main_objectives[0].content, en: "" } }],
    })).toBe("profile");
  });

  it("fills legacy notes into all five language slots for safe editing", () => {
    expect(completeLocalizedProfile(undefined, "legacy")).toEqual({
      kk: "legacy", ru: "legacy", en: "legacy", ky: "legacy", uz: "legacy",
    });
  });

  it("rejects zero costs before the backend request", () => {
    expect(validatePreschoolAdminSettings({ ...settings, topic_token_cost: 0 })).toBe("costs");
  });
});
