import { describe, expect, it } from "vitest";
import { splitRichContent } from "./rich-content";

describe("generated handout tables", () => {
  it("recognizes the actual twelve-child observation card without a separator row", () => {
    const text = `Бақылау картасы — Жұмсақ матаның түстерін байқау\n\nБала № | Матаға жақындады | Матаны ұстады | Түсті көрсетті | Қызығушылық танытты\n${Array.from({ length: 12 }, (_, i) => `${i + 1} | ☐ | ☐ | ☐ | ☐`).join("\n")}\n\nЕскертпе: ☐ белгісін қойыңыз немесе түсті қарындашпен бояңыз.`;
    const blocks = splitRichContent(text);
    expect(blocks).toHaveLength(3);
    expect(blocks[0]).toMatchObject({ type: "markdown", text: "Бақылау картасы — Жұмсақ матаның түстерін байқау\n" });
    expect(blocks[1]).toEqual({ type: "table", headings: ["Бала №", "Матаға жақындады", "Матаны ұстады", "Түсті көрсетті", "Қызығушылық танытты"], rows: Array.from({ length: 12 }, (_, i) => [String(i + 1), "☐", "☐", "☐", "☐"]) });
    expect(blocks[2]).toMatchObject({ type: "markdown", text: expect.stringContaining("Ескертпе") });
  });
  it.each([1, 2, 12, 30])("supports %i observation rows without hardcoded participant counts", count => {
    const blocks = splitRichContent(`Күн | Нәтиже\n${Array.from({ length: count }, (_, i) => `${i + 1} | _____`).join("\n")}`);
    expect(blocks).toEqual([{ type: "table", headings: ["Күн", "Нәтиже"], rows: Array.from({ length: count }, (_, i) => [String(i + 1), "_____"]) }]);
  });
  it("handles normal Markdown separators, optional outer pipes and inline formatting", () => {
    expect(splitRichContent("| **Күн** | Нәтиже |\r\n| :--- | ---: |\r\n| 1 | *Бос* |\r\n| 2 |  |" )).toEqual([{ type: "table", headings: ["**Күн**", "Нәтиже"], rows: [["1", "*Бос*"], ["2", ""]] }]);
    expect(splitRichContent("A|B\n---|---\n1|2")).toEqual([{ type: "table", headings: ["A", "B"], rows: [["1", "2"]] }]);
  });
  it("does not split escaped pipes or pipes inside inline code", () => {
    expect(splitRichContent("Зат | Белгі\nA \\| B | `x | y`\nC | ``a `|` b``")).toEqual([{ type: "table", headings: ["Зат", "Белгі"], rows: [["A \\| B", "`x | y`"], ["C", "``a `|` b``"]] }]);
  });
  it("keeps isolated pipe phrases, inconsistent rows and empty-header fragments as prose", () => {
    for (const text of ["Таңдау: иә | жоқ", "A | B\nбір баған", "A | B\n1 | 2 | 3", "A | B\n--- | ---", "| |\n| 1 | 2 |", "Use `a | b` in code\nnext | line"]) expect(splitRichContent(text)).toEqual([{ type: "markdown", text }]);
  });
  it("preserves fenced and indented code blocks containing table-like lines", () => {
    for (const text of ["```text\nA | B\n1 | 2\n```", "~~~\nA | B\n1 | 2\n~~~", "    A | B\n    1 | 2"]) expect(splitRichContent(text)).toEqual([{ type: "markdown", text }]);
  });
  it("preserves prose before and after a table and handles multiple table widths", () => {
    const blocks = splitRichContent("## Кіріспе\nҚысқа мәтін.\n\nA | B\n1 | 2\n\n**Түсіндіру.**\n\nX | Y | Z\nа | ә | б\n\nСоңы.");
    expect(blocks.map(x => x.type)).toEqual(["markdown", "table", "markdown", "table", "markdown"]);
    expect(blocks[2]).toMatchObject({ text: expect.stringContaining("**Түсіндіру.**") });
  });
});
