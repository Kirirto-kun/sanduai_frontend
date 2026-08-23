import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createPresentation,
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
