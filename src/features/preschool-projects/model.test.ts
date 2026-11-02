import { describe, expect, it } from "vitest";
import { AGE_GROUPS, OUTPUT_MODES, PROJECT_TYPES, ageYearsLabel, blankProject, isProjectDraft, isProjectResult, projectSubmission, selectOutput, selectProjectType } from "./model";
import { projectFixture } from "./fixtures.test-support";

describe("preschool project input and recovery", () => {
  it("covers all twelve directions, eleven outputs and five preschool groups", () => {
    expect(PROJECT_TYPES).toHaveLength(12); expect(OUTPUT_MODES).toHaveLength(11); expect(AGE_GROUPS.map(x => x.age)).toEqual([1, 2, 3, 4, 5]);
    expect(blankProject()).toMatchObject({ language: "kk", project_status: "planned", observations: "", output_mode: "full_package" });
    expect(isProjectDraft(blankProject())).toBe(true);
  });
  it("normalizes authoritative output choices without changing unrelated personal input", () => {
    const initial = { ...blankProject(), topic: "Достық", duration: "one_day" as const, author: "Педагог" };
    expect(selectOutput(initial, "ecological_project")).toMatchObject({ project_type: "ecological", topic: "Достық", author: "Педагог" });
    expect(selectOutput(initial, "weekly_project").duration).toBe("week");
    expect(selectOutput(initial, "long_term_project").duration).toBe("month");
    expect(selectOutput({ ...initial, duration: "year" }, "long_term_project").duration).toBe("year");
    expect(selectOutput({ ...initial, project_type: "steam" }, "stem_project").project_type).toBe("steam");
    expect(selectOutput(initial, "competition_project")).toMatchObject({ is_competition: true, project_type: "competition" });
    expect(selectProjectType(selectOutput(initial, "ecological_project"), "creative")).toMatchObject({ project_type: "creative", output_mode: "full_package" });
    expect(selectProjectType(initial, "long_term")).toMatchObject({ duration: "month" });
    expect(selectOutput({ ...initial, project_type: "long_term" }, "weekly_project")).toMatchObject({ duration: "week", project_type: "cognitive" });
    expect(selectProjectType(selectOutput(initial, "weekly_project"), "long_term")).toMatchObject({ duration: "month", output_mode: "full_package" });
    expect([1, 2, 4, 5].map(x => ageYearsLabel(x, "ru"))).toEqual(["1 год", "2 года", "4 года", "5 лет"]);
  });
  it("cleans list input and protects saved observations when planning a different project", () => {
    const input = { ...blankProject(), topic: ` ${"Ұ".repeat(500)} `, materials: [" Қағаз ", "", "Жапсырма "], observations: "Ескі тәжірибенің нақты деректері" };
    const next = projectSubmission(input);
    expect(next.title).toHaveLength(240); expect(next.payload.topic).toHaveLength(500);
    expect(next.payload.materials).toEqual(["Қағаз", "Жапсырма"]);
    expect(next.payload.observations).toBe(""); expect(input.observations).toContain("Ескі");
    expect(projectSubmission({ ...input, project_status: "in_progress" }).payload.observations).toBe(input.observations);
    expect(projectSubmission({ ...blankProject(), output_mode: "ideas" }).title).toContain("идеялар");
  });
  it("rejects corrupt or incompatible stored drafts while preserving an incomplete topic", () => {
    for (const patch of [{ participant_count: 0 }, { participant_count: 101 }, { participant_count: 2.4 }, { participant_count: NaN }, { project_type: "school_science" }, { age_group: "grade_1" }, { duration: "10_years" }, { language: "fr" }, { materials: Array.from({ length: 26 }, () => "Paper") }, { observations: "x".repeat(10001) }, { is_competition: "yes" }, { child_personal_data: "private" }]) expect(isProjectDraft({ ...blankProject(), ...patch }), JSON.stringify(patch)).toBe(false);
    expect(isProjectDraft({ ...blankProject(), topic: "" })).toBe(true);
    expect(isProjectDraft(null)).toBe(false);
  });
  it("only accepts stored results with a complete supported contract", () => {
    expect(isProjectResult(projectFixture())).toBe(true);
    expect(isProjectResult({ ...projectFixture(), diary: undefined })).toBe(false);
    expect(isProjectResult({ ...projectFixture(), language: "fr" })).toBe(false);
    expect(isProjectResult({ ...projectFixture(), age_group: "primary" })).toBe(false);
  });
});
