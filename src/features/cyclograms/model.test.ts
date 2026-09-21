import { describe, expect, it } from "vitest";
import { changedCells, cyclogramDisplayLanguage, draftKey, formatDate, hasFiveDayRows, nextWeek, normalizeInput, replaceCell, resolveInitialCyclogramLanguage, validateInput, weekDates } from "./model";
import type { CyclogramInput } from "./types";

describe("cyclogram calendar", () => {
  it("normalizes a Sunday to its preceding Monday and Friday", () => {
    expect(weekDates("2026-09-20")).toEqual(["2026-09-14", "2026-09-15", "2026-09-16", "2026-09-17", "2026-09-18"]);
  });
  it("handles year and leap-day boundaries", () => {
    expect(weekDates("2028-02-29")[4]).toBe("2028-03-03");
    expect(nextWeek("2026-12-31")).toBe("2027-01-04");
  });
  it("formats built-in document languages without relying on browser ICU data", () => {
    expect(formatDate("2026-09-14", "kk")).toBe("14 қыр.");
    expect(formatDate("2026-09-14", "ru")).toBe("14 сент.");
    expect(formatDate("2026-09-14", "en")).toBe("14 Sep");
    expect(formatDate("2026-09-14", "ky")).toBe("14 сент.");
    expect(formatDate("2026-09-14", "uz")).toBe("14 sen");
  });
  it.each(["2026-02-30", "invalid", "2026-13-01", "", "2026-1-01"])("rejects invalid calendar value %s", date => {
    expect(weekDates(date)).toEqual([]);
  });
});

describe("editing a saved document", () => {
  it("defaults new create and history views to the configured interface language", () => {
    const configured = ["kk", "ru", "en", "ky", "uz"];
    expect(resolveInitialCyclogramLanguage("", "ru", configured)).toBe("ru");
    expect(resolveInitialCyclogramLanguage("", "kk", configured)).toBe("kk");
    expect(resolveInitialCyclogramLanguage("ky", "ru", configured)).toBe("ky");
  });
  it("uses a safe configured fallback when the interface language is unavailable", () => {
    expect(resolveInitialCyclogramLanguage("", "ru", ["en", "uz"])).toBe("en");
    expect(resolveInitialCyclogramLanguage("removed", "ru", ["kk", "ru"])).toBe("ru");
    expect(resolveInitialCyclogramLanguage("", "ru", [])).toBe("ru");
  });
  it("uses the opened document language for generated-document copy", () => {
    expect(cyclogramDisplayLanguage("document", "kk", "ru")).toBe("ru");
    expect(cyclogramDisplayLanguage("create", "kk", "ru")).toBe("kk");
    expect(cyclogramDisplayLanguage("history", "en", "ru")).toBe("en");
  });
  it("changes exactly the selected cell without mutating existing content", () => {
    const original = { rows: [{ section_id: "walk", cells: ["a", "b", "c", "d", "e"] }, { section_id: "sleep", cells: ["1", "2", "3", "4", "5"] }] };
    const edited = replaceCell(original, "walk", 1, "new");
    expect(edited.rows[0].cells).toEqual(["a", "new", "c", "d", "e"]);
    expect(edited.rows[1]).toBe(original.rows[1]);
    expect(original.rows[0].cells[1]).toBe("b");
    expect(changedCells(original, edited)).toEqual([{ section_id: "walk", day_index: 1, text: "new" }]);
    expect(() => replaceCell(original, "walk", 5, "bad")).toThrow();
    expect(() => replaceCell(original, "missing", 1, "bad")).toThrow();
  });
  it("isolates unsaved drafts by authenticated user and document", () => {
    expect(draftKey("user-a", "doc")).not.toEqual(draftKey("user-b", "doc"));
    expect(draftKey("user-a", "doc-a")).not.toEqual(draftKey("user-a", "doc-b"));
  });
  it("requires valid generation settings without requiring an organization", () => {
    const input: CyclogramInput = { organization: "", group_id: "middle", age: 3, group_name: "Балапан", teacher_name: "Алия", week_start: "2026-09-14", weekly_theme: "Күз", notes: "", language: "kk" };
    expect(validateInput(input)).toBeNull();
    expect(validateInput({ ...input, weekly_theme: "   " })).toBe("weekly_theme");
    expect(validateInput({ ...input, age: 7 })).toBe("age");
    expect(validateInput({ ...input, group_name: " " })).toBe("group_name");
    expect(validateInput({ ...input, teacher_name: " " })).toBe("teacher_name");
  });
  it("normalizes the submitted date to Monday and trims teacher input", () => {
    const input: CyclogramInput = { organization: "  A  ", group_id: "middle", age: 3, group_name: " Балапан ", teacher_name: " Алия ", week_start: "2026-09-20", weekly_theme: " Күз ", notes: "  ", language: "kk" };
    expect(normalizeInput(input)).toMatchObject({ organization: "A", group_name: "Балапан", teacher_name: "Алия", week_start: "2026-09-14", weekly_theme: "Күз", notes: "" });
  });
  it("rejects malformed server content instead of silently editing it", () => {
    expect(hasFiveDayRows({ rows: [{ section_id: "walk", cells: ["a", "b"] }] })).toBe(false);
    expect(() => replaceCell({ rows: [{ section_id: "walk", cells: ["a", "b"] }] }, "walk", 1, "new")).toThrow("Invalid cyclogram content");
  });
});
