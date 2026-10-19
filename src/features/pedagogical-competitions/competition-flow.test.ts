import { describe, expect, it } from "vitest";
import { blankCompetitionInput, validateCompetitionStep } from "./CompetitionWizard";
import { generationSourceHref, isPrimaryGenerationMaterial } from "@/lib/generation-history";

function authorInput() {
  const input = blankCompetitionInput("ru");
  Object.assign(input, { competition_id: "PPI_2026", direction_id: "reading", title: "Три маршрута чтения", subject: "Литература", grade: "6 класс", author_idea: "Три маршрута чтения с самостоятельным выбором уровня поддержки.", author_contribution: "Я создала три карточки маршрута и дневник текстовых доказательств." });
  input.experience = { problem: "Ученики пересказывают текст без доказательств.", application: "Ученики выбрали карточку и выписали аргументы.", novelty: "Уровень поддержки выбирает сам ученик.", task: "Найдите фрагмент и обоснуйте мнение о герое.", results: "", materials: "Три карточки и авторский дневник." };
  input.confirmations = { unpublished: true, not_submitted: true, original: true };
  return input;
}

describe("competition authorship flow", () => {
  it("starts with safety enabled and no assumed originality confirmations", () => {
    const input = blankCompetitionInput("kk");
    expect(input.safe_mode).toBe(true);
    expect(Object.values(input.confirmations).some(Boolean)).toBe(false);
  });
  it("blocks whitespace author idea even when context and practice are complete", () => {
    const input = authorInput(); input.author_idea = "  \n  ";
    expect(validateCompetitionStep(input, 1, "ru")).toBeTruthy();
  });
  it("requires a personal contribution separately from the author idea", () => {
    const input = authorInput(); input.author_contribution = "";
    expect(validateCompetitionStep(input, 1, "kk")).toBeTruthy();
  });
  it("lets an author prepare a draft without claiming an unmeasured result", () => {
    const input = authorInput();
    expect(validateCompetitionStep(input, 2, "ru")).toBeNull();
    expect(input.experience.results).toBe("");
  });
  it("blocks preparation if any individual origin confirmation is missing", () => {
    for (const key of ["unpublished", "not_submitted", "original"] as const) {
      const input = authorInput(); input.confirmations[key] = false;
      expect(validateCompetitionStep(input, 3, "ru")).toBeTruthy();
    }
  });
  it("rejects an incomplete citation and non-web source URL", () => {
    const input = authorInput();
    input.references = [{ author: "Автор", title: "Реальная работа", year: "2025", url: "javascript:alert(1)" }];
    expect(validateCompetitionStep(input, 3, "ru")).toBeTruthy();
    input.references[0].url = "https://example.org/publication";
    input.references[0].author = "";
    expect(validateCompetitionStep(input, 3, "ru")).toBeTruthy();
  });
  it("routes recovered competition jobs back to the competition workspace", () => {
    expect(generationSourceHref({ id: "example-job", kind: "competition.generate", source_path: "/dashboard/ai/pedagogical-ideas" })).toBe("/dashboard/ai/pedagogical-ideas?competitionJob=example-job");
    expect(generationSourceHref({ id: "lesson-job", kind: "pedagogical_idea.generate", source_path: "/dashboard/ai/pedagogical-ideas" })).toBe("/dashboard/ai/pedagogical-ideas?job=lesson-job");
    expect(isPrimaryGenerationMaterial({ kind: "competition.action" })).toBe(false);
  });
});
