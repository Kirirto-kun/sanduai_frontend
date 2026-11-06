import { describe, expect, it } from "vitest";
import { blankMeeting, isMeetingDraft, isMeetingResult, meetingSubmission } from "./model";
import { meetingFixture } from "./fixtures.test-helper";

describe("parent meeting request and retained result boundaries", () => {
  it("requires organizer acceptance and never invents the audience or dates", () => {
    const draft = blankMeeting();
    expect(draft).toMatchObject({ class_group: "", topic: "", duration_minutes: 45, participant_count: 20, defaults_accepted: false, meeting_date: "", meeting_time: "", venue: "" });
    expect(isMeetingDraft(draft)).toBe(true);
    expect(() => meetingSubmission({ ...draft, topic: "Listening", class_group: "1" })).toThrow("INVALID_MEETING_INPUT");
    expect(meetingSubmission({ ...draft, topic: "Listening", class_group: "1", defaults_accepted: true }).payload.class_group).toBe("1");
  });
  it("keeps incomplete list typing in drafts and normalizes only at submission", () => {
    const draft = { ...blankMeeting(), topic: ` ${"Т".repeat(500)} `, class_group: " 3 A ", defaults_accepted: true, resources: [" Paper", "", "Pens; screen\nCards "], issues: [" Support", " Listening", ""] };
    const submission = meetingSubmission(draft);
    expect(submission.title).toHaveLength(240);
    expect(submission.payload.resources).toEqual(["Paper", "Pens", "screen", "Cards"]);
    expect(submission.payload.issues).toEqual(["Support", "Listening"]);
    expect(draft.issues).toEqual([" Support", " Listening", ""]);
    expect(isMeetingDraft({ ...blankMeeting(), resources: ["A", ""] })).toBe(true);
    expect(() => meetingSubmission({ ...blankMeeting(), topic: "Listening", class_group: "1", defaults_accepted: true, resources: ["A"] })).toThrow("INVALID_MEETING_INPUT");
  });
  it.each([{ duration_minutes: 14 }, { duration_minutes: 181 }, { duration_minutes: 45.5 }, { duration_minutes: Number.NaN },
    { participant_count: 0 }, { participant_count: 301 }, { participant_count: 1.5 }, { organization: "college" },
    { delivery_format: "remote" }, { meeting_format: "__proto__" }, { language: "xx" }, { defaults_accepted: "yes" },
    { extra: "property" }, JSON.parse('{"__proto__":{"topic":"injected"}}'), { issues: Array(13).fill("Issue") },
    { specialists: Array(11).fill("Psychologist") }, { resources: ["x".repeat(1201)] }, { institution_name: "x".repeat(251) },
  ])("rejects malformed device data %j", patch => expect(isMeetingDraft({ ...blankMeeting(), ...patch })).toBe(false));
  it.each([false, true])("accepts the complete %s compact scenario without forcing grouping", compact => {
    expect(isMeetingResult(meetingFixture(compact))).toBe(true);
  });
  it("rejects corrupted nested documents, timeline gaps, duplicate tasks and missing materials before rendering", () => {
    const r = meetingFixture();
    const patches = [
      { concept: null }, { reflection: { ...r.reflection, questions: null } }, { invitation: {} }, { stages: r.stages.slice(1) },
      { stages: [...r.stages].reverse() }, { stages: r.stages.map((x, i) => i === 2 ? { ...x, start_minute: 99 } : x) },
      { interactive_tasks: r.interactive_tasks.map(x => ({ ...x, duration_minutes: 9 })) }, { interactive_tasks: [r.interactive_tasks[0], r.interactive_tasks[0]] },
      { interactive_tasks: r.interactive_tasks.map(x => ({ ...x, steps: [null] })) }, { slides: r.slides.slice(1) },
      { slides: r.slides.map((x, i) => ({ ...x, number: i + 2 })) }, { training_cards: [null] },
      { questionnaire: { ...r.questionnaire, questions: [{ question: "Incomplete", options: ["Only one"] }] } },
      { worksheets: [{ ...r.worksheets[0], task_title: "Wrong task" }, r.worksheets[1]] }, { digital_tools: [null] },
      { safety_notes: [] }, { quality_checks: [null] }, { recommendations: [] },
    ];
    for (const patch of patches) expect(isMeetingResult({ ...r, ...patch }), JSON.stringify(patch)).toBe(false);
  });
});
