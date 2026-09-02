import { describe, expect, it } from "vitest";

import {
  filterGenerationJobsByKind,
  generationExpiryCopy,
  generationJobIdFromSearchParam,
  generationResultHref,
  generationSourceHref,
  isActiveGenerationJob,
  isPrimaryGenerationMaterial,
  selectGenerationHistoryPage,
  sortUniqueGenerationJobs,
} from "./generation-history";
import type { GenerationJobSummary } from "./api";


const JOB_ID = "30bdc3b2-41e6-4399-877c-cbab8e93a5d9";


describe("generation history deep links", () => {
  it("accepts canonical job UUIDs and rejects malformed values", () => {
    expect(generationJobIdFromSearchParam(JOB_ID)).toBe(JOB_ID);
    expect(generationJobIdFromSearchParam("job-1")).toBeNull();
    expect(generationJobIdFromSearchParam(null)).toBeNull();
  });

  it("builds a reload-safe result URL", () => {
    expect(generationResultHref(JOB_ID)).toBe(`/dashboard/generations?job=${JOB_ID}`);
  });

  it("opens a material in the module that created it", () => {
    expect(generationSourceHref({
      id: JOB_ID,
      source_path: "/dashboard/ai/lesson-plan",
    })).toBe(`/dashboard/ai/lesson-plan?job=${JOB_ID}`);
    expect(generationSourceHref({
      id: JOB_ID,
      source_path: "/dashboard/ai/tests?mode=topic",
    })).toBe(`/dashboard/ai/tests?mode=topic&job=${JOB_ID}`);
    expect(generationSourceHref({
      id: JOB_ID,
      source_path: "/dashboard/library/games/at-zharys",
    })).toBe(`/dashboard/library/games/at-zharys?job=${JOB_ID}`);
  });

  it("does not promise a 24-hour deadline before the server supplies one", () => {
    expect(generationExpiryCopy({ status: "running", expires_at: null }, "ru"))
      .toBe("Срок хранения появится после завершения");
    expect(generationExpiryCopy({ status: "queued", expires_at: null }, "kk"))
      .toBe("Сақтау мерзімі жұмыс аяқталған соң көрсетіледі");
  });

  it("recognizes resumable server states", () => {
    expect(isActiveGenerationJob({ status: "queued" })).toBe(true);
    expect(isActiveGenerationJob({ status: "running" })).toBe(true);
    expect(isActiveGenerationJob({ status: "completed" })).toBe(false);
  });

  it("combines paged module histories without duplicates and keeps newest first", () => {
    const base = {
      kind: "lesson_plan.generate",
      title: "Plan",
      source_path: "/dashboard/ai/lesson-plan",
      status: "completed" as const,
      progress: {},
      cost_tokens: 1,
      captured_tokens: 1,
      billing_status: "captured" as const,
      attempt_count: 1,
      cancel_requested: false,
      error_code: null,
      error_message: null,
      updated_at: "2026-09-01T00:00:00Z",
      started_at: "2026-09-01T00:00:00Z",
      completed_at: "2026-09-01T00:00:00Z",
      expires_at: "2026-09-16T00:00:00Z",
    };
    const older = { ...base, id: "older", created_at: "2026-08-31T00:00:00Z" };
    const newer = { ...base, id: "newer", created_at: "2026-09-01T00:00:00Z" };

    expect(sortUniqueGenerationJobs([older, newer, older]).map((job) => job.id))
      .toEqual(["newer", "older"]);
    expect(selectGenerationHistoryPage([older, newer, older], 1)).toMatchObject({
      items: [{ id: "newer" }],
      hasMore: true,
    });
    expect(selectGenerationHistoryPage([older], 6, true).hasMore).toBe(true);
  });

  it("keeps only jobs owned by a module kind", () => {
    const jobs = [
      { id: "kmzh", kind: "kmzh.generate" },
      { id: "essay", kind: "essay.generate" },
    ] as GenerationJobSummary[];
    expect(filterGenerationJobsByKind(jobs, ["kmzh.generate"]).map((job) => job.id))
      .toEqual(["kmzh"]);
  });

  it("does not display revisions and section workers as separate materials", () => {
    expect(isPrimaryGenerationMaterial({ kind: "kmzh.generate" })).toBe(true);
    expect(isPrimaryGenerationMaterial({ kind: "essay.revise" })).toBe(false);
    expect(isPrimaryGenerationMaterial({ kind: "science.section" })).toBe(false);
    expect(isPrimaryGenerationMaterial({ kind: "science.finalize" })).toBe(false);
  });
});
