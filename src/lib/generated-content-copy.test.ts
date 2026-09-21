import { describe, expect, it } from "vitest";

import { CONTENT_LANGUAGE_CODES } from "./content-languages";
import { generatedContentCopy } from "./generated-content-copy";


describe("generated content labels", () => {
  it("provides artifact labels for every supported content language", () => {
    for (const language of CONTENT_LANGUAGE_CODES) {
      const copy = generatedContentCopy(language);
      expect(copy.lessonPlan.title).toBeTruthy();
      expect(copy.exam.question).toBeTruthy();
      expect(copy.scientificProject.titlePage).toBeTruthy();
      expect(copy.cyclogram.regulatory).toBeTruthy();
      expect(copy.race.team).toBeTruthy();
      expect(copy.race.finish).toBeTruthy();
      expect(copy.race.enterFullscreen).toBeTruthy();
    }
  });

  it("keeps Russian artifact headings purely Russian", () => {
    const copy = generatedContentCopy("ru");
    expect(copy.lessonPlan.title).toBe("Краткосрочный план");
    expect(copy.scientificProject.titlePage).toBe("Титульная страница");
    expect(copy.cyclogram.regulatory).toBe("В соответствии с требованиями дошкольного воспитания и обучения");
    expect(JSON.stringify(copy)).not.toMatch(/[әғқңөұүһі]/iu);
  });

  it("uses distinct English, Kyrgyz, and Uzbek artifact headings", () => {
    expect(generatedContentCopy("en").worksheet.answers).toBe("Answers");
    expect(generatedContentCopy("en").comic.panel).toBe("Panel");
    expect(generatedContentCopy("ky").quiz.question).toBe("Суроонун тексти");
    expect(generatedContentCopy("uz").article.keywords).toBe("Kalit so‘zlar");
    expect(generatedContentCopy("en").race.questionsEnded).toBe("No questions left");
    expect(generatedContentCopy("ky").race.victory).toBe("Жеңиш!");
    expect(generatedContentCopy("uz").race.team).toBe("Jamoa");
  });
});
