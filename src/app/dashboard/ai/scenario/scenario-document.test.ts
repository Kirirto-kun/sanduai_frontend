import { describe, expect, it } from "vitest";

import type { ScenarioResult } from "../../../../lib/visuals-ai-api";
import {
  buildScenarioDocumentHtml,
  scenarioDocumentFileName,
  scenarioDocumentLabels,
} from "../../../../lib/scenario-document";

const result: ScenarioResult = {
  title: "Наурыз / мереке",
  goal: "Дәстүрді <түсіну>",
  equipment: "Домбыра & плакат",
  total_minutes: 20,
  cost_tokens: 10,
  disclaimer: "",
  blocks: [
    {
      index: 1,
      block_type: "intro",
      title: "Ашылу",
      minutes: 5,
      content: "Бірінші жол\nЕкінші жол",
      participants: "Жүргізуші",
      props: "Микрофон",
    },
  ],
};

const labels = {
  total: "Барлығы",
  program: "Бағдарлама",
  goal: "Мақсаты",
  equipment: "Реквизит",
  participants: "Қатысушылар",
  props: "Дайындау",
  minutes: "мин",
};

describe("scenario Word document", () => {
  it("renders readable sections instead of JSON and escapes generated text", () => {
    const html = buildScenarioDocumentHtml(result, labels);

    expect(html).toContain("<h1>Наурыз / мереке</h1>");
    expect(html).toContain("Дәстүрді &lt;түсіну&gt;");
    expect(html).toContain("Домбыра &amp; плакат");
    expect(html).toContain("Бірінші жол<br>Екінші жол");
    expect(html).not.toContain('"blocks"');
  });

  it("creates a filesystem-safe Word filename", () => {
    expect(scenarioDocumentFileName(result.title)).toBe("Наурыз_-_мереке.doc");
  });

  it.each([
    ["en", "Objective", "Equipment"],
    ["ky", "Максаты", "Керектүү жабдуулар"],
    ["uz", "Maqsad", "Kerakli jihozlar"],
  ] as const)("provides %s-only export labels", (language, goal, equipment) => {
    expect(scenarioDocumentLabels(language)).toMatchObject({ goal, equipment });
  });

  it("provides content-language labels for the on-screen summary", () => {
    expect(scenarioDocumentLabels("ru").total).toBe("Всего");
    expect(scenarioDocumentLabels("en").program).toBe("Programme");
    expect(scenarioDocumentLabels("ky").minutes).toBe("мүнөт");
    expect(scenarioDocumentLabels("uz").participants).toBe("Ishtirokchilar");
  });
});
