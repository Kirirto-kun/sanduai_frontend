import { describe, expect, it } from "vitest";
import type { PresentationProject } from "@/types/presentations";
import { generationJobId, isActivePresentationJob } from "./editor-state";

function project(overrides: Partial<PresentationProject>): PresentationProject {
  return {
    id: "project-1",
    title: "Test",
    mode: "classic",
    status: "ready",
    language: "kk",
    created_at: "2026-08-23T00:00:00Z",
    read_only: false,
    source_missing: false,
    legacy_presenton_id: null,
    artifacts: [],
    ...overrides,
  };
}

describe("presentation editor job state", () => {
  it("locks unknown and active states, but not terminal states", () => {
    expect(isActivePresentationJob({ id: "1", status: "queued" })).toBe(true);
    expect(isActivePresentationJob({ id: "2", status: "provider_wait" })).toBe(true);
    expect(isActivePresentationJob({ id: "3", status: "completed" })).toBe(false);
    expect(isActivePresentationJob({ id: "4", status: "cancelled" })).toBe(false);
  });

  it("uses an active regenerate job immediately on reload", () => {
    const value = project({
      latest_job: { id: "regen-1", kind: "regenerate", status: "running" },
      active_generation: { id: "generation-1", job_id: "old-job", status: "completed" },
    });
    expect(generationJobId(value, null)).toBe("regen-1");
    expect(isActivePresentationJob(value.latest_job)).toBe(true);
  });

  it("does not track export as generation progress but still exposes its active lock", () => {
    const value = project({
      latest_job: { id: "export-1", kind: "export", status: "running" },
    });
    expect(generationJobId(value, null)).toBeNull();
    expect(isActivePresentationJob(value.latest_job)).toBe(true);
  });
});
