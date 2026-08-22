import { afterEach, describe, expect, it, vi } from "vitest";

import { exportEssayDocx, generateImage, generateVoiceover } from "./api";
import { teacherFacingErrorMessage } from "./teacher-facing-error";

function errorResponse(status: number, detail: string): Response {
  return new Response(JSON.stringify({ detail }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("representative teacher-facing API call sites", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("keeps export status structured and hides the raw provider response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        errorResponse(503, "document provider failed: secret-stack"),
      ),
    );

    const error = await exportEssayDocx({
      title: "Title",
      essay_plan: [],
      content_blocks: [],
    }).catch((caught: unknown) => caught);

    expect(error).toMatchObject({ status: 503 });
    const message = teacherFacingErrorMessage(error, "ru");
    expect(message).toBe("Сервис временно недоступен. Попробуйте ещё раз чуть позже.");
    expect(message).not.toContain("provider");
    expect(message).not.toContain("secret-stack");
  });

  it("uses localized validation copy for an image-generation 422", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(errorResponse(422, "prompt schema internal detail")),
    );

    const error = await generateImage({ prompt: "classroom" }).catch(
      (caught: unknown) => caught,
    );

    expect(teacherFacingErrorMessage(error, "kk")).toBe(
      "Толтырылған өрістерді тексеріп, қайталап көріңіз.",
    );
  });

  it("keeps a feature-specific insufficient-coins message for voiceover", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            detail: {
              code: "INSUFFICIENT_TOKENS",
              message: "internal billing diagnostic",
              required: 12,
              available: 3,
            },
          }),
          { status: 402, headers: { "Content-Type": "application/json" } },
        ),
      ),
    );

    const error = await generateVoiceover({
      text: "Сәлем",
      voice_id: "voice-1",
    } as Parameters<typeof generateVoiceover>[0]).catch((caught: unknown) => caught);

    expect(error).toMatchObject({ required: 12, available: 3 });

    expect(
      teacherFacingErrorMessage(error, "kk", {
        insufficientCoins: "Дыбыстауға монета жеткіліксіз.",
      }),
    ).toBe("Дыбыстауға монета жеткіліксіз.");
  });
});
