import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createPresentation,
  listSavedKmzhSources,
  PresentationApiError,
} from "./presentations-api";

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
