import { describe, expect, it } from "vitest";
import { masterclassCoverUrl, masterclassHandoffEnabled, masterclassHandoffPayloadError, masterclassHandoffScope, masterclassHandoffSource, type MasterclassHandoffPayload } from "./handoff-policy";

const id = "cfb515f3-5ff3-4658-a22e-8934ad92a917";
const source = (values: Record<string, string> = {}) => masterclassHandoffSource(new URLSearchParams({ masterclassWork: id, ...values }));
const payload: MasterclassHandoffPayload = { title: "Workshop", topic: "Workshop", prompt: "Full brief", notes: "Print a worksheet", language: "ky", source_text: "Full scenario", share_url: "http://localhost:3000/masterclasses/shared/unguessable" };

describe("masterclass handoff source isolation", () => {
  it("does not enable a signed-out, malformed or occupied destination", () => {
    expect(masterclassHandoffEnabled(source(), null, true)).toBe(false);
    expect(masterclassHandoffEnabled(source(), "owner", false)).toBe(false);
    expect(masterclassHandoffEnabled(source({ masterclassWork: "other-user<script>" }), "owner", true)).toBe(false);
    expect(masterclassHandoffEnabled(source({ stage_id: "../private" }), "owner", true)).toBe(false);
    expect(masterclassHandoffEnabled(source({ variant: "unknown" }), "owner", true)).toBe(false);
    expect(masterclassHandoffEnabled(source({ variant: "hand_tracking" }), "owner", true)).toBe(false);
    expect(masterclassHandoffEnabled(source({ stage_id: "practice_one", interactive_id: "quiz_1" }), "owner", true)).toBe(false);
    expect(masterclassHandoffEnabled(source(), "owner", true)).toBe(true);
    expect(source({ masterclassWork: id.toUpperCase() }).id).toBe(id);
  });
  it("keeps owner, target and selected blocks out of each other's cache scope", () => {
    const original = masterclassHandoffScope("teacher-a", "builder", source());
    expect(masterclassHandoffScope("teacher-b", "builder", source())).not.toBe(original);
    expect(masterclassHandoffScope("teacher-a", "visual", source())).not.toBe(original);
    expect(masterclassHandoffScope("teacher-a", "builder", source({ stage_id: "practice-1" }))).not.toBe(original);
    expect(masterclassHandoffScope("teacher-a", "builder", source({ interactive_id: "quiz-2" }))).not.toBe(original);
    expect(masterclassHandoffScope("teacher-a", "builder", source({ interactive_id: "quiz-2", variant: "hand_tracking" }))).not.toBe(masterclassHandoffScope("teacher-a", "builder", source({ interactive_id: "quiz-2", variant: "three_d" })));
  });
  it("does not treat a plain old editor URL as a masterclass handoff", () => {
    const ordinary = masterclassHandoffSource(new URLSearchParams({ prompt: "Old prefill", job: id }));
    expect(ordinary.requested).toBe(false);
    expect(masterclassHandoffEnabled(ordinary, "owner", true)).toBe(false);
  });
  it("only permits this work's same-origin cover before attaching an access token", () => {
    const path = `/masterclasses/works/${id}/cover`;
    expect(masterclassCoverUrl(path, "http://127.0.0.1:8000", id)).toBe(`http://127.0.0.1:8000${path}`);
    for (const url of [`https://external.example${path}`, "/users/me", `${path}?redirect=other`, `${path}#other`, path.replace(id, "11111111-1111-1111-1111-111111111111")]) {
      expect(() => masterclassCoverUrl(url, "http://127.0.0.1:8000", id)).toThrow("Invalid cover source");
    }
  });
});

describe("destination contracts preserve full content", () => {
  it("accepts an 8k builder prompt and 60k presentation scenario intact", () => {
    const full = { ...payload, prompt: "x".repeat(8_000), source_text: "y".repeat(60_000) };
    expect(masterclassHandoffPayloadError("builder", full)).toBeNull();
    expect(masterclassHandoffPayloadError("presentation", full)).toBeNull();
    expect(full.prompt).toHaveLength(8_000);
    expect(full.source_text).toHaveLength(60_000);
  });
  it("rejects overflow rather than passing a truncated prompt or scenario", () => {
    expect(masterclassHandoffPayloadError("builder", { ...payload, prompt: "x".repeat(12_001) })).toBe("builder");
    expect(masterclassHandoffPayloadError("presentation", { ...payload, source_text: "x".repeat(80_001) })).toBe("presentation");
    expect(masterclassHandoffPayloadError("visual", { ...payload, topic: "x".repeat(1_001) })).toBe("visual");
    expect(masterclassHandoffPayloadError("visual", { ...payload, notes: "x".repeat(2_001) })).toBe("visual");
  });
  it("accepts the complete supported visual notes and prevents executable QR URLs", () => {
    expect(masterclassHandoffPayloadError("visual", { ...payload, notes: "x".repeat(2_000) })).toBeNull();
    expect(masterclassHandoffPayloadError("qr", payload)).toBeNull();
    expect(masterclassHandoffPayloadError("qr", { ...payload, share_url: "javascript:alert(1)" })).toBe("qr");
  });
});
