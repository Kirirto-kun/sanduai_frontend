import { describe, expect, it } from "vitest";

import type { ProjectState } from "./api";
import {
  completeScienceProjectFromState,
  hasActiveScienceProject,
  scienceProjectOpenHref,
  scienceProjectProgressLabel,
} from "./science-project-history";


function projectState(overrides: Partial<ProjectState> = {}): ProjectState {
  return {
    project_id: "55abf704-874c-44d2-9d25-739f4e276bfd",
    user_id: "owner",
    topic: "Water",
    language: "kk",
    step: 1,
    plan: {
      project_id: "55abf704-874c-44d2-9d25-739f4e276bfd",
      hypothesis: "Hypothesis",
      object: "Object",
      subject_field: "Subject",
      methods: ["Experiment"],
      structure: {
        chapter_1_title: "Theory",
        chapter_1_subsections: ["One"],
        chapter_2_title: "Practice",
        chapter_2_subsections: ["Two"],
      },
      scientific_novelty: "Novelty",
      practical_significance: "Value",
    },
    sections: {},
    tokens_spent: 25,
    created_at: "2026-09-01T00:00:00Z",
    updated_at: "2026-09-01T00:00:00Z",
    ...overrides,
  };
}


describe("science project history", () => {
  it("routes one project to its current native wizard step", () => {
    expect(scienceProjectOpenHref(projectState())).toMatch(/\/plan$/);
    expect(scienceProjectOpenHref(projectState({ step: 3 }))).toMatch(/\/generate$/);
    expect(scienceProjectOpenHref(projectState({
      step: 5,
      sections: {
        introduction: "I",
        chapter_1: "C1",
        chapter_2: "C2",
        conclusion: "C",
      },
    }))).toMatch(/\/edit$/);
  });

  it("reconstructs the finalized document from persisted project state", () => {
    const result = completeScienceProjectFromState(projectState({
      step: 6,
      sections: {
        title_page: "Title",
        annotation: "Annotation",
        table_of_contents: "Contents",
        introduction: "Intro",
        chapter_1: "Theory",
        chapter_2: "Research",
        conclusion: "Conclusion",
        references: "References",
        appendix: "Appendix",
      },
    }));

    expect(result).toMatchObject({
      language: "kk",
      chapter_1_theory: "Theory",
      chapter_2_research: "Research",
    });
  });

  it("does not pretend an unfinished project is exportable", () => {
    expect(completeScienceProjectFromState(projectState({ step: 5 }))).toBeNull();
    expect(scienceProjectProgressLabel(3, 2, "ru")).toBe("Готово разделов: 2 / 4");
  });

  it("opens an active server job instead of enqueueing a duplicate", () => {
    expect(scienceProjectOpenHref({
      project_id: "55abf704-874c-44d2-9d25-739f4e276bfd",
      step: 3,
      sections_ready: 1,
      active_job_id: "30bdc3b2-41e6-4399-877c-cbab8e93a5d9",
      active_job_kind: "science.generate_all",
    })).toBe(
      "/dashboard/ai/scientific-projects/55abf704-874c-44d2-9d25-739f4e276bfd/generate?job=30bdc3b2-41e6-4399-877c-cbab8e93a5d9",
    );
  });

  it("shows generation in progress only when the server reports an active job", () => {
    expect(hasActiveScienceProject([{ active_job_id: null }, {}])).toBe(false);
    expect(hasActiveScienceProject([{ active_job_id: "active-job" }])).toBe(true);
    expect(scienceProjectProgressLabel(1, 0, "ru", null)).toBe("План готов");
    expect(scienceProjectProgressLabel(1, 0, "ru", "active-job")).toBe("Проект создаётся");
    expect(scienceProjectProgressLabel(1, 0, "kk", "active-job")).toBe("Жоба жасалып жатыр");
  });
});
