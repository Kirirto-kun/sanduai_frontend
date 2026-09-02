import { describe, expect, it } from "vitest";

import type { DraftPlanResponse } from "../../../../../../lib/api";

import { applyScienceProjectPlanEdit } from "./plan-utils";

const plan: DraftPlanResponse = {
  project_id: "project-1",
  hypothesis: "Initial hypothesis",
  object: "Initial object",
  subject_field: "Initial subject",
  methods: ["Observation"],
  structure: {
    chapter_1_title: "Theory",
    chapter_1_subsections: ["Definition"],
    chapter_2_title: "Practice",
    chapter_2_subsections: ["Experiment"],
  },
  scientific_novelty: "Initial novelty",
  practical_significance: "Initial value",
};

describe("applyScienceProjectPlanEdit", () => {
  it("commits a pending text edit without mutating the loaded plan", () => {
    const updated = applyScienceProjectPlanEdit(plan, "scientific_novelty", "  New result  ");

    expect(updated.scientific_novelty).toBe("New result");
    expect(plan.scientific_novelty).toBe("Initial novelty");
    expect(updated.structure).not.toBe(plan.structure);
  });

  it("normalizes a pending subsection edit into non-empty lines", () => {
    const updated = applyScienceProjectPlanEdit(
      plan,
      "chapter_2_subsections",
      " First experiment \n\n Second experiment ",
    );

    expect(updated.structure.chapter_2_subsections).toEqual([
      "First experiment",
      "Second experiment",
    ]);
    expect(plan.structure.chapter_2_subsections).toEqual(["Experiment"]);
  });
});
