import { describe, expect, it } from "vitest";
import { blankCoaching, coachingSubmission, isCoachingDraft, isCoachingResult } from "./model";
import { coachingFixture } from "./fixtures.test-helper";

describe("coaching input and retained result contracts", () => {
  it("discloses practical defaults without treating them as consent", () => {
    const input = blankCoaching();
    expect(input).toMatchObject({ language: "kk", duration_minutes: 45, participant_count: 20, group_count: 4, format: "offline", defaults_accepted: false });
    expect(isCoachingDraft(input)).toBe(true);
    expect(() => coachingSubmission({ ...input, topic: "Feedback" })).toThrow("INVALID_COACHING_INPUT");
  });
  it("retains in-progress list typing and submits the latest normalized values", () => {
    const input = { ...blankCoaching(), topic: ` ${"Т".repeat(500)} `, defaults_accepted: true, resources: [" Paper", "", "Pens; screen\nCards "], methods: [" Case", " Role play", ""] };
    const submission = coachingSubmission(input);
    expect(submission.title).toHaveLength(240);
    expect(submission.payload.topic).toHaveLength(500);
    expect(submission.payload.resources).toEqual(["Paper", "Pens", "screen", "Cards"]);
    expect(submission.payload.methods).toEqual(["Case", "Role play"]);
    expect(input.methods).toEqual([" Case", " Role play", ""]);
    expect(isCoachingDraft({ ...blankCoaching(), resources: ["Paper", ""] })).toBe(true);
  });
  it.each([
    { participant_count: 1 }, { participant_count: 2.5 }, { duration_minutes: 14 }, { duration_minutes: 241 },
    { group_count: 21 }, { group_count: 0 }, { group_count: Number.NaN }, { format: "remote" },
    { include_ai: "yes" }, { extra: true }, { resources: ["x".repeat(1001)] }, { methods: Array(16).fill("case") },
  ])("rejects invalid saved request values %j", patch => expect(isCoachingDraft({ ...blankCoaching(), ...patch })).toBe(false));
  it("rejects missing nested data, altered order, broken timing and task totals before rendering", () => {
    const r = coachingFixture();
    expect(isCoachingResult(r)).toBe(true);
    const patches = [
      { reflection: null }, { concept: {} }, { grouping: { method: "x", instructions: "y", groups: [null] } },
      { stages: r.stages.slice(1) }, { stages: r.stages.map((x, i) => i === 1 ? { ...x, start_minute: 0 } : x) },
      { stages: [...r.stages].reverse() }, { practical_tasks: r.practical_tasks.map(x => ({ ...x, duration_minutes: 6 })) },
      { practical_tasks: r.practical_tasks.map(x => ({ ...x, steps: null })) }, { slides: [{ ...r.slides[0], number: 2 }] },
      { quality_checks: [null] }, { participant_activity_percent: 101 },
    ];
    for (const patch of patches) expect(isCoachingResult({ ...r, ...patch }), JSON.stringify(patch)).toBe(false);
  });
});
