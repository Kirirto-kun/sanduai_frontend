import { describe, expect, it } from "vitest";
import { API_ERROR_CODES, ApiRequestError } from "./http-client";
import { visualGenerationErrorMessage } from "./visuals-ai-errors";

describe("visualGenerationErrorMessage", () => {
  it("maps a backend image code without exposing its raw message", () => {
    const error = new ApiRequestError(
      "secret provider stack trace",
      502,
      {
        detail: {
          code: "IMAGE_GENERATION_FAILED",
          message: "secret provider stack trace",
        },
      },
      API_ERROR_CODES.SERVER_ERROR,
    );

    const message = visualGenerationErrorMessage(error, "kk");

    expect(message).toBe("Суретті жасау мүмкін болмады. Қайталап көріңіз.");
    expect(message).not.toContain("provider");
    expect(message).not.toContain("secret");
  });

  it("maps network failures to localized connection copy", () => {
    const error = new ApiRequestError(
      "Unable to reach internal host",
      0,
      undefined,
      API_ERROR_CODES.NETWORK_ERROR,
    );

    expect(visualGenerationErrorMessage(error, "ru")).toBe(
      "Не удалось связаться с сервисом. Проверьте интернет и попробуйте ещё раз.",
    );
  });

  it("maps validation failures without showing raw Pydantic wording", () => {
    const error = new ApiRequestError(
      "Input should be a valid list",
      422,
      { detail: [{ msg: "Input should be a valid list" }] },
      API_ERROR_CODES.VALIDATION_ERROR,
    );

    expect(visualGenerationErrorMessage(error, "ru")).toBe(
      "Проверьте заполненные поля и попробуйте ещё раз.",
    );
  });

  it("fails closed for unknown exception types", () => {
    expect(
      visualGenerationErrorMessage(new Error("raw SDK exception"), "ru"),
    ).toBe("Не удалось создать изображение. Попробуйте ещё раз.");
  });

  it.each(["kk", "ru"] as const)(
    "never returns a raw API message for the %s locale",
    (language) => {
      const error = new ApiRequestError(
        "raw internal provider diagnostic",
        500,
        undefined,
        API_ERROR_CODES.SERVER_ERROR,
      );

      const message = visualGenerationErrorMessage(error, language);

      expect(message).not.toContain("raw");
      expect(message).not.toContain("provider");
      expect(message).not.toBe(error.message);
    },
  );
});
