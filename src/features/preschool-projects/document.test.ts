import { describe, expect, it } from "vitest";
import { CONTENT_LANGUAGE_CODES } from "@/lib/content-languages";
import { projectFixture } from "./fixtures.test-support";
import { projectDurationLabel, projectLabel, projectMarkdown } from "./document";

describe("complete project text export", () => {
  it("retains every practical, diary, presentation, source and inclusion field", () => {
    const result = projectFixture(); const text = projectMarkdown(result);
    for (const value of [result.topic, result.goal, result.sections[0].content, result.ideas[0].question, result.calendar[0].teacher_action, result.calendar[0].recording, result.experiments[0].adult_preparation, result.experiments[0].comparison, result.experiments[0].conclusion_questions[0], result.diary[0].activity, result.artifacts[0].content, result.slides[0].photo_placeholder, result.slides[0].speaker_notes, result.defense_script, result.evaluation[0].evidence, result.development[0].child_action, result.values[0].child_action, result.inclusion[0], result.safety[0], result.sources[0].url, result.regulatory_note]) expect(text).toContain(value);
    expect(text).toContain("Бос ұяшықтар нәтиже болып саналмайды"); expect(text).toContain("Нақты нәтижелер әлі берілмеген");
    expect(text).toContain("1 апта");
  });
  it("keeps actual observations verbatim and escapes structural pipes in tables", () => {
    const r = projectFixture(); r.actual_results = ["1-күні өскін болмады, 4-күні 2 см болды"]; r.calendar[0].child_action = "A | B\nC";
    const text = projectMarkdown(r);
    expect(text).toContain(r.actual_results[0]); expect(text).not.toContain("Нақты нәтижелер әлі берілмеген");
    expect(text).toContain("A \\| B<br>C");
  });
  it("uses headings and duration in the material’s stored language", () => {
    for (const language of CONTENT_LANGUAGE_CODES) {
      const r = { ...projectFixture(), language };
      expect(projectMarkdown(r)).toContain(`## ${projectLabel(language, "calendar")}`);
      expect(projectDurationLabel(r)).toBeTruthy();
      expect(projectLabel(language, "actual_empty")).toBeTruthy();
    }
  });
});
