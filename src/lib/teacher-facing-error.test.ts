import { describe, expect, it } from "vitest";

import { API_ERROR_CODES, ApiRequestError } from "./http-client";
import {
  TeacherFacingError,
  teacherFacingErrorMessage,
} from "./teacher-facing-error";

describe("teacherFacingErrorMessage", () => {
  it.each([
    [401, "Сессия завершилась"],
    [402, "Недостаточно монет"],
    [409, "Данные уже изменились"],
    [422, "Проверьте заполненные поля"],
    [429, "Слишком много запросов"],
    [503, "Сервис временно недоступен"],
  ])("maps HTTP %s without exposing response diagnostics", (status, expected) => {
    const message = teacherFacingErrorMessage(
      new ApiRequestError("provider stack trace secret-key", status),
      "ru",
    );

    expect(message).toContain(expected);
    expect(message).not.toContain("provider");
    expect(message).not.toContain("secret-key");
  });

  it("maps timeout and network errors in both languages", () => {
    expect(
      teacherFacingErrorMessage(
        new ApiRequestError("The request timed out", 0, undefined, API_ERROR_CODES.TIMEOUT),
        "kk",
      ),
    ).toContain("ұзаққа");
    expect(
      teacherFacingErrorMessage(
        new ApiRequestError("Unable to reach", 0, undefined, API_ERROR_CODES.NETWORK_ERROR),
        "ru",
      ),
    ).toBe("Не удалось связаться с сервисом. Подождите немного и попробуйте ещё раз.");
  });

  it("preserves an explicitly supplied feature-specific insufficient-coins message", () => {
    const error = Object.assign(new Error("raw token provider response"), {
      name: "InsufficientTokensError",
    });

    expect(
      teacherFacingErrorMessage(error, "kk", {
        insufficientCoins: "Осы құралға 10 монета қажет.",
      }),
    ).toBe("Осы құралға 10 монета қажет.");
  });

  it("never returns unknown raw provider or English transport diagnostics", () => {
    const raw = "OpenAI upstream failed: connection reset; api-key=secret";
    const message = teacherFacingErrorMessage(new Error(raw), "kk");

    expect(message).toBe("Әрекетті орындау мүмкін болмады. Қайталап көріңіз.");
    expect(message).not.toContain("OpenAI");
    expect(message).not.toContain("secret");
  });

  it("allows only messages already marked as teacher-facing", () => {
    expect(
      teacherFacingErrorMessage(new TeacherFacingError("Қауіпсіз хабарлама"), "kk"),
    ).toBe("Қауіпсіз хабарлама");
  });
});
