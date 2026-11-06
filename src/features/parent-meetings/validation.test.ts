import { afterEach, describe, expect, it, vi } from "vitest";
import { blankMeeting } from "./model";
import { focusMeetingProblem, meetingListProblems } from "./validation";

describe("actionable optional-list validation", () => {
  it.each([
    ["issues", "meeting-issues", 12, "Вопросы для обсуждения", "Талқыланатын мәселелер"],
    ["specialists", "meeting-specialists", 10, "Приглашённые специалисты", "Қатысатын мамандар"],
    ["resources", "meeting-resources", 20, "Доступные материалы", "Қолжетімді материалдар"],
  ] as const)("maps %s item length and count failures to its actual control in both interface languages", (key, targetId, limit, ru, kk) => {
    for (const language of ["ru", "kk"] as const) {
      const label = language === "ru" ? ru : kk;
      for (const item of ["a", "a".repeat(1201)]) {
        const problems = meetingListProblems({ ...blankMeeting(), [key]: ["", ` Valid; ${item} `] }, language);
        expect(problems).toHaveLength(1);
        expect(problems[0]).toMatchObject({ targetId });
        expect(problems[0].message).toContain(label);
        expect(problems[0].message).toMatch(/2.*1200/);
        expect(problems[0].message).toContain(language === "ru" ? "пункт 2" : "2-тармақ");
      }
      const tooMany = meetingListProblems({ ...blankMeeting(), [key]: Array(limit + 1).fill("Valid") }, language);
      expect(tooMany[0]).toMatchObject({ targetId });
      expect(tooMany[0].message).toContain(String(limit));
      expect(tooMany[0].message).toContain(String(limit + 1));
    }
  });
  it("accepts empty fields and valid normalized boundaries without changing draft typing", () => {
    const input = { ...blankMeeting(), resources: ["  ", "AB", "", "a".repeat(1200)] };
    const original = JSON.stringify(input);
    expect(meetingListProblems(input, "ru")).toEqual([]);
    expect(meetingListProblems({ ...input, issues: Array(12).fill("Valid"), specialists: Array(10).fill("Valid"), resources: Array(20).fill("Valid") }, "kk")).toEqual([]);
    expect(JSON.stringify(input)).toBe(original);
  });
  it("reports multiple affected fields in form order", () => {
    expect(meetingListProblems({ ...blankMeeting(), resources: ["a"], issues: ["b"], specialists: ["c"] }, "ru").map(x => x.targetId)).toEqual(["meeting-issues", "meeting-specialists", "meeting-resources"]);
  });
});

describe("revealing a validation target", () => {
  afterEach(() => vi.unstubAllGlobals());
  it("opens the optional section before focusing and scrolling to the invalid control", () => {
    class Details { open = false; parentElement = null; }
    const section = new Details();
    const focus = vi.fn(() => expect(section.open).toBe(true));
    const scrollIntoView = vi.fn();
    vi.stubGlobal("HTMLDetailsElement", Details);
    vi.stubGlobal("document", { getElementById: vi.fn(id => id === "meeting-issues" ? { parentElement: section, focus, scrollIntoView } : null) });
    focusMeetingProblem("meeting-issues");
    expect(focus).toHaveBeenCalledWith({ preventScroll: true });
    expect(scrollIntoView).toHaveBeenCalledWith({ block: "center", behavior: "auto" });
    expect(() => focusMeetingProblem("missing-target")).not.toThrow();
  });
});
