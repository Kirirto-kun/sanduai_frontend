import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createExport,
  createPresentation,
  listSavedKmzhSources,
  PresentationApiError,
  regenerateSlide,
  startGeneration,
  startPlanJob,
  updateSlide,
} from "./presentations-api";
import { API_ERROR_CODES } from "./http-client";

const PROJECT_ID = "182a6bdf-54c6-41c4-9fa2-fb98259441e7";
const PLAN_ID = "44f9ce20-c082-4dc5-862c-5726ed57427a";
const JOB_ID = "30bdc3b2-41e6-4399-877c-cbab8e93a5d9";

const enqueueCases = [
  {
    label: "plan generation",
    kind: "plan",
    request: () => startPlanJob(PROJECT_ID),
  },
  {
    label: "slide generation",
    kind: "generate",
    request: () => startGeneration(PROJECT_ID, PLAN_ID),
  },
  {
    label: "classic slide update",
    kind: "regenerate",
    request: () => updateSlide(PROJECT_ID, "slide-1", { title: "Updated" }),
  },
  {
    label: "slide regeneration",
    kind: "regenerate",
    request: () => regenerateSlide(PROJECT_ID, "slide-1", "Try again"),
  },
  {
    label: "export generation",
    kind: "export",
    request: () => createExport(PROJECT_ID, { format: "pptx", variant: "editable" }),
  },
] as const;

describe("presentation job acknowledgement", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it.each(enqueueCases)("accepts an exact 202 for $label", async ({ kind, request }) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
      new Response(JSON.stringify({
        id: JOB_ID,
        job_id: JOB_ID,
        kind,
        status: "queued",
      }), {
        status: 202,
        headers: { "Content-Type": "application/json" },
      }),
    ));

    await expect(request()).resolves.toMatchObject({
      job_id: JOB_ID,
      kind,
      status: "queued",
    });
  });

  it.each(enqueueCases)("rejects a non-202 success for $label", async ({ kind, request }) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
      new Response(JSON.stringify({
        id: JOB_ID,
        job_id: JOB_ID,
        kind,
        status: "queued",
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    ));

    await expect(request()).rejects.toMatchObject({
      status: 200,
      code: API_ERROR_CODES.INVALID_RESPONSE,
    });
  });

  it.each([
    ["a missing job_id", { id: JOB_ID, kind: "plan", status: "queued" }],
    ["a malformed job_id", { job_id: "not-a-uuid", kind: "plan", status: "queued" }],
    ["the wrong job kind", { job_id: JOB_ID, kind: "generate", status: "queued" }],
    ["an unknown job status", { job_id: JOB_ID, kind: "plan", status: "unknown" }],
  ])("rejects a 202 acknowledgement with %s", async (_label, payload) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
      new Response(JSON.stringify(payload), {
        status: 202,
        headers: { "Content-Type": "application/json" },
      }),
    ));

    await expect(startPlanJob(PROJECT_ID)).rejects.toMatchObject({
      status: 502,
      code: API_ERROR_CODES.INVALID_RESPONSE,
      message: "The server returned an invalid presentation job acknowledgement.",
    });
  });
});

describe("presentation API errors", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("extracts FastAPI stable codes and messages from nested detail", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            detail: {
              code: "presentation_generation_in_progress",
              message: "A generation is already running.",
            },
          }),
          {
            status: 409,
            headers: { "Content-Type": "application/json" },
          },
        ),
      ),
    );

    const request = createPresentation({
      mode: "creative",
      title: "Test",
      topic: "Test",
      language: "kk",
      slide_count: 1,
    });

    await expect(request).rejects.toMatchObject({
      name: "PresentationApiError",
      status: 409,
      serverCode: "presentation_generation_in_progress",
      message: "A generation is already running.",
    } satisfies Partial<PresentationApiError>);
  });
});

describe("presentation lesson-plan sources", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("requests only completed, unexpired KMJ sources visible to the current user", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ items: [], total: 0, has_more: false }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await listSavedKmzhSources();

    const url = new URL(String(fetchMock.mock.calls[0]?.[0]));
    expect(url.pathname).toBe("/api/v1/generations");
    expect(url.searchParams.get("kind")).toBe("kmzh.generate");
    expect(url.searchParams.get("status")).toBe("completed");
    expect(url.searchParams.get("limit")).toBe("100");
  });

  it("sends the saved KMJ reference through the protected project contract", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: "presentation-1" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await createPresentation({
      mode: "creative",
      title: "Компьютер жады",
      topic: "Компьютер жады",
      language: "kk",
      slide_count: 10,
      source_kind: "lesson_plan",
      source_generation_job_id: "4be58520-e6e0-4330-a7de-6a62b72a0142",
    });

    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const body = JSON.parse(String(init.body)) as Record<string, unknown>;
    expect(body).toMatchObject({
      source_kind: "lesson_plan",
      source_generation_job_id: "4be58520-e6e0-4330-a7de-6a62b72a0142",
    });
    expect(body).not.toHaveProperty("source_text");
  });
});
