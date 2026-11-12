import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createExport,
  createPresentation,
  getPresentationCapabilities,
  getJob,
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

  it("preserves capacity retry timing without retrying a paid POST", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      detail: { code: "RESOURCE_CAPACITY_BUSY", message: "private diagnostic" },
    }), { status: 503, headers: { "Content-Type": "application/json", "Retry-After": "5" } }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(startGeneration(PROJECT_ID, PLAN_ID)).rejects.toMatchObject({
      status: 503, serverCode: "RESOURCE_CAPACITY_BUSY", retryAfterSeconds: 5,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe("presentation operation availability", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("reads independent creative, classic and export availability", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      modes: ["classic"], creative: { available: false }, classic: { available: true },
      planner: { remote_available: false, fallback_available: true },
      operations: { presentation_plan: "available", creative_slides: "unavailable", classic_render: "busy", presentation_export: "available" },
    }), { headers: { "Content-Type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(getPresentationCapabilities()).resolves.toMatchObject({
      operations: { creative_slides: "unavailable", classic_render: "busy", presentation_export: "available" },
      planner: { fallback_available: true },
    });
    expect(new URL(String(fetchMock.mock.calls[0]?.[0])).pathname).toBe("/api/v2/presentations/capabilities");
    expect(fetchMock.mock.calls[0]?.[1]?.method ?? "GET").toBe("GET");
  });
});

describe("presentation write identity recovery", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("reuses the persisted identity after a lost acknowledgement and browser reload", async () => {
    const values = new Map<string, string>();
    values.set("sanduai_token", `header.${Buffer.from(JSON.stringify({ sub: "teacher-recovery-a" })).toString("base64url")}.signature`);
    vi.stubGlobal("window", { localStorage: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    } });
    const fetchMock = vi.fn().mockRejectedValueOnce(new TypeError("lost acknowledgement"))
      .mockImplementation(async (_url, init: RequestInit) => new Response(JSON.stringify(
        init?.method === "POST" ? { job_id: JOB_ID, kind: "generate", status: "queued" }
          : { id: JOB_ID, kind: "generate", status: "completed" },
      ), { status: init?.method === "POST" ? 202 : 200, headers: { "Content-Type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(startGeneration(PROJECT_ID, PLAN_ID)).rejects.toMatchObject({ status: 0 });
    const firstKey = new Headers(fetchMock.mock.calls[0]?.[1]?.headers).get("Idempotency-Key");
    vi.resetModules();
    const reloaded = await import("./presentations-api");
    await reloaded.startGeneration(PROJECT_ID, PLAN_ID);
    const recoveredKey = new Headers(fetchMock.mock.calls[1]?.[1]?.headers).get("Idempotency-Key");
    expect(recoveredKey).toBe(firstKey);
    expect(recoveredKey).toBeTruthy();
    await reloaded.getJob(JOB_ID);
    await reloaded.startGeneration(PROJECT_ID, PLAN_ID);
    expect(new Headers(fetchMock.mock.calls[3]?.[1]?.headers).get("Idempotency-Key")).not.toBe(firstKey);
    values.set("sanduai_token", `header.${Buffer.from(JSON.stringify({ sub: "teacher-recovery-b" })).toString("base64url")}.signature`);
    await reloaded.startGeneration(PROJECT_ID, PLAN_ID);
    expect(new Headers(fetchMock.mock.calls[4]?.[1]?.headers).get("Idempotency-Key"))
      .not.toBe(new Headers(fetchMock.mock.calls[3]?.[1]?.headers).get("Idempotency-Key"));
  });

  it("only reads the same job after a first status 503", async () => {
    const methods: string[] = [];
    vi.stubGlobal("fetch", vi.fn(async (_url, init: RequestInit) => {
      methods.push(init.method ?? "GET");
      return methods.length === 1
        ? new Response(JSON.stringify({ detail: "temporarily busy" }), { status: 503 })
        : new Response(JSON.stringify({ id: JOB_ID, status: "completed" }), { headers: { "Content-Type": "application/json" } });
    }));
    await expect(getJob(JOB_ID)).rejects.toMatchObject({ status: 503 });
    await expect(getJob(JOB_ID)).resolves.toMatchObject({ id: JOB_ID, status: "completed" });
    expect(methods).toEqual(["GET", "GET"]);
  });

  it("keeps the same plan identity when recovery spells out the default regenerate flag", async () => {
    const fetchMock = vi.fn().mockRejectedValueOnce(new TypeError("lost plan acknowledgement"))
      .mockResolvedValue(new Response(JSON.stringify({ job_id: JOB_ID, kind: "plan", status: "queued" }), { status: 202 }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(startPlanJob(PROJECT_ID)).rejects.toMatchObject({ status: 0 });
    await startPlanJob(PROJECT_ID, { regenerate: false });
    expect(new Headers(fetchMock.mock.calls[1]?.[1]?.headers).get("Idempotency-Key"))
      .toBe(new Headers(fetchMock.mock.calls[0]?.[1]?.headers).get("Idempotency-Key"));
  });
});

describe("presentation lesson-plan sources", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("requests only completed, unexpired KMJ sources visible to the current user", async () => {
    const fetchMock = vi.fn().mockImplementation(async () =>
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
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(new URL(String(fetchMock.mock.calls[1]?.[0])).searchParams.get("kind")).toBe("kmzh.classic.generate");
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
