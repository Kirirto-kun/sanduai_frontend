import { describe, expect, it } from "vitest";
import { barGeometry, blankDiaryEntry, blankRequest, EVIDENCE_STATUSES, eligibility, isDraft, MODE_TEMPLATE, MODES, parseData, requestFingerprint, restoreDraft, SECTION_FALLBACK, wordCount } from "./model";
import type { Draft } from "./types";

function draft(): Draft { return { version: 1, request: blankRequest(), dataText: "", projectId: null, documents: [] }; }
describe("Scientific Research PRO content boundaries", () => {
  it("exposes all 15 distinct modes and 19 sections without Zerde age rules", () => {
    expect(MODES).toHaveLength(15); expect(new Set(MODES.map(m => m.id)).size).toBe(15); expect(SECTION_FALLBACK).toHaveLength(19);
    expect(SECTION_FALLBACK.filter(s => s.direction === "science")).toHaveLength(11); expect(SECTION_FALLBACK.filter(s => s.direction === "humanities")).toHaveLength(8);
    expect(MODES.every(mode => MODE_TEMPLATE[mode.id])).toBe(true);
    expect(eligibility([8, 12], "kk").eligible).toBe(true); expect(eligibility([7], "ru").eligible).toBe(false); expect(eligibility([9, 10, 11], "ru").eligible).toBe(false);
    expect(eligibility([12], "ru").message).toContain("уточните");
  });
  it("starts in Kazakh and retains all author-entered passport fields", () => {
    const request = blankRequest(); expect(request.language).toBe("kk"); expect(request.grades).toEqual([9]); expect(request.competition).toBe(""); expect(request.stages).toBe(""); expect(request.recording).toBe(""); expect(request.supervisor).toBe(null); expect(request.data).toEqual([]);
    expect(Object.keys(blankDiaryEntry())).toEqual(["date", "stage", "goal", "action", "data", "difficulties", "changes", "evidence", "author"]);
  });
});
describe("Evidence-safe data entry", () => {
  it("preserves negative values, decimal commas, provenance and units", () => {
    const parsed = parseData("Бақылау; -2,5; observed; °C\nСынақ; 0; measured; °C\nЖоспар; 10; planned; °C");
    expect(parsed.invalidLines).toEqual([]); expect(parsed.data).toEqual([{ label: "Бақылау", value: -2.5, status: "observed", unit: "°C" }, { label: "Сынақ", value: 0, status: "measured", unit: "°C" }, { label: "Жоспар", value: 10, status: "planned", unit: "°C" }]);
  });
  it("never changes missing values into zero or accepts nonfinite numbers", () => {
    const parsed = parseData("Нет измерения;\nA;NaN\nB;Infinity\nC;1e309\n;12\nD;5;verified\nE;7;measured;cm;extra\nValid;0");
    expect(parsed.invalidLines).toEqual([1, 2, 3, 4, 5, 6, 7]); expect(parsed.data).toEqual([{ label: "Valid", value: 0, status: "measured", unit: "" }]);
  });
  it("supports all seven evidence states and explicit row limits", () => {
    expect(parseData(EVIDENCE_STATUSES.map(([id], i) => `${id};${i};${id}`).join("\n")).data).toHaveLength(7);
    expect(parseData(Array.from({ length: 501 }, (_, i) => `row ${i};${i}`).join("\n")).tooMany).toBe(true);
    expect(parseData("A\t-1,25").data[0].value).toBe(-1.25);
  });
  it("plots negative and positive values on the correct sides of zero", () => { expect(barGeometry(-5, 10)).toEqual({ width: "25%", left: "25%" }); expect(barGeometry(10, 10)).toEqual({ width: "50%", left: "50%" }); expect(barGeometry(0, 0)).toEqual({ width: "0%", left: "50%" }); });
  it("counts multilingual annotations without losing empty-text semantics", () => { expect(wordCount("  ")).toBe(0); expect(wordCount("Ғылыми жоба\nнаучный проект\tstudy")).toBe(5); });
});
describe("Private versioned draft recovery", () => {
  it("validates a complete draft and preserves author slots", () => { const value = draft(); value.request.contributions = ["", "Екінші автордың үлесі"]; expect(isDraft(value)).toBe(true); });
  it("rejects corrupt storage safely instead of throwing or restoring invalid evidence", () => {
    for (const value of [null, {}, { ...draft(), version: 2 }, { ...draft(), request: { ...blankRequest(), grades: "9" } }, { ...draft(), request: { ...blankRequest(), sources: [123] } }, { ...draft(), request: { ...blankRequest(), data: [{ label: "A", value: Infinity }] } }, { ...draft(), request: { ...blankRequest(), diary: [{}] } }, { ...draft(), request: { ...blankRequest(), section: "zerde-section" } }]) expect(isDraft(value)).toBe(false);
  });
  it("fingerprints evidence and authored answers while deduplicating file order", () => {
    const a = { ...blankRequest(), document_ids: ["b", "a"] }; const b = { ...a, document_ids: ["a", "b", "a"] }; expect(requestFingerprint(a)).toBe(requestFingerprint(b));
    expect(requestFingerprint({ ...a, expert_answer: "My own answer" })).not.toBe(requestFingerprint(a));
  });
  it("recovers additive schema fields without losing an existing author's materials", () => {
    const old = { ...draft(), request: { ...blankRequest(), authored_text: "Менің нақты зерттеуім" } };
    const partial = old.request as Partial<typeof old.request>; delete partial.stages; delete partial.recording; delete partial.data_order; delete partial.percent_change_meaningful;
    expect(restoreDraft(old)?.request).toMatchObject({ authored_text: "Менің нақты зерттеуім", stages: "", recording: "", data_order: "comparison", percent_change_meaningful: false });
    expect(restoreDraft({ ...old, request: { ...old.request, injected: true } })).toBeNull();
  });
});
