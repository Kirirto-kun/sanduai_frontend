import { describe, expect, it } from "vitest";
import { AUDIENCES, audienceDuration, blankTraining, isTrainingDraft, selectOutput } from "./model";

describe("training defaults and recoverable drafts", () => {
  it("starts in Kazakh and uses adult timing for educator audiences", () => {
    expect(blankTraining()).toMatchObject({ language: "kk", duration_minutes: 45, participant_count: 20 });
    expect(audienceDuration("primary_teachers")).toBe(45);
    expect(audienceDuration("preschool_teachers")).toBe(45);
    expect(audienceDuration("primary_students")).toBe(35);
    expect(audienceDuration("preschool_children")).toBe(25);
  });

  it("keeps custom timing between ordinary modes and applies a realistic express default", () => {
    const custom = { ...blankTraining(), duration_minutes: 90 };
    expect(selectOutput(custom, "ideas").duration_minutes).toBe(90);
    expect(selectOutput(custom, "express").duration_minutes).toBe(10);
    expect(selectOutput({ ...custom, duration_minutes: 7 }, "express").duration_minutes).toBe(7);
    expect(selectOutput({ ...custom, duration_minutes: Number.NaN }, "express").duration_minutes).toBe(10);
  });

  it("restores age-appropriate timing after an express training in either stored audience language", () => {
    for (const locale of ["kk", "ru"] as const) {
      for (const [id, duration] of [["preschool_children", 25], ["primary_students", 35], ["teachers", 45]] as const) {
        const input = { ...blankTraining(), audience: AUDIENCES.find(item => item.id === id)![locale], duration_minutes: duration };
        expect(selectOutput(selectOutput(input, "express"), "full_scenario").duration_minutes).toBe(duration);
      }
    }
  });

  it("permits incomplete topic drafts but rejects values the server cannot accept", () => {
    expect(isTrainingDraft(blankTraining())).toBe(true);
    expect(isTrainingDraft({ ...blankTraining(), participant_count: 2 })).toBe(true);
    for (const patch of [
      { participant_count: 1 }, { participant_count: 2.5 }, { participant_count: Number.NaN },
      { duration_minutes: 241 }, { output_mode: "express", duration_minutes: 20 },
      { audience: "a".repeat(251) }, { venue: "a".repeat(301) }, { notes: "a".repeat(2501) },
      { materials: Array.from({ length: 21 }, () => "Paper") },
      { digital_tools: Array.from({ length: 16 }, () => "Screen") },
      { materials: ["  "] }, { materials: ["a".repeat(1001)] }, { include_ai: "yes" }, { unknown_server_field: true },
    ]) expect(isTrainingDraft({ ...blankTraining(), ...patch }), JSON.stringify(patch)).toBe(false);
  });
});
