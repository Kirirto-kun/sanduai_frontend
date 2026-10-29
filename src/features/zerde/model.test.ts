import { describe, expect, it } from "vitest";
import { barGeometry, blankRequest, eligibility, isAssessment, isDraft, MODES, parseData, SECTION_FALLBACK, wordCount } from "./model";

describe("Zerde participation and evidence", () => {
  it("only admits classes 2–8 and at most two authors", () => {
    for (const grade of [0, 1, 9, 10, 11, 4.5]) expect(eligibility([grade], "ru").eligible).toBe(false);
    expect(eligibility([], "ru").eligible).toBe(false);
    expect(eligibility([2, 3, 4], "ru").eligible).toBe(false);
    for (let grade = 2; grade <= 8; grade++) expect(eligibility([grade], "kk").eligible).toBe(true);
  });
  it("blocks mixed age teams and evaluates at the older class", () => {
    expect(eligibility([4, 5], "ru").eligible).toBe(false);
    expect(eligibility([5, 4], "kk").eligible).toBe(false);
    expect(eligibility([2, 4], "kk")).toMatchObject({ eligible: true, effective: 4, junior: true });
    expect(eligibility([8, 5], "ru")).toMatchObject({ eligible: true, effective: 8, junior: false });
  });
  it("preserves actual signed values, decimal commas and zero", () => {
    expect(parseData("Бақылау; 0\nӨсу; 12,5\nАзайған; -2.75\n\n")).toEqual({ data: [{ label: "Бақылау", value: 0 }, { label: "Өсу", value: 12.5 }, { label: "Азайған", value: -2.75 }], invalidLines: [] });
  });
  it("does not silently coerce missing or malformed measurements into data", () => {
    expect(parseData("күн; \n;1\nөлшем;NaN\nөлшем;2;3\nөлшем;Infinity")).toEqual({ data: [], invalidLines: [1, 2, 3, 4, 5] });
    expect(parseData("күн\t3").data).toEqual([{ label: "күн", value: 3 }]);
  });
  it("draws signed bars on the correct side of the common zero", () => {
    expect(barGeometry(-10, 10)).toEqual({ left: "0%", width: "50%" });
    expect(barGeometry(10, 10)).toEqual({ left: "50%", width: "50%" });
    expect(barGeometry(0, 10)).toEqual({ left: "50%", width: "0%" });
    expect(barGeometry(-5, 10)).toEqual({ left: "25%", width: "25%" });
  });
  it("restores only supported draft versions without inventing research or codes", () => {
    const request = blankRequest();
    expect(request.authored_text).toBe(""); expect(request.data).toEqual([]); expect(request.registration_code).toBe("");
    expect(isDraft({ request, dataText: "", projectId: null, documents: [] })).toBe(true);
    expect(isDraft({ request: { ...request, mode: "ghostwrite" }, dataText: "", projectId: null, documents: [] })).toBe(false);
    expect(isDraft({ request: { ...request, grades: [4, 5, 6] }, dataText: "", projectId: null, documents: [] })).toBe(false);
    expect(isAssessment({ mode: "idea", title: "fake" })).toBe(false);
  });
  it("includes fourteen distinct modes and official section identifiers", () => {
    expect(new Set(MODES.map(m => m.id)).size).toBe(14);
    expect(SECTION_FALLBACK.map(s => s.id)).toEqual(["mathematics", "physics", "tourism", "chemistry", "informatics", "ecology", "kazakh", "russian", "languages", "history", "heritage", "design"]);
    expect(wordCount("  Зерттеу\n сұрағы  бар ")).toBe(3); expect(wordCount("  ")).toBe(0);
  });
});
