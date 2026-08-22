import { describe, expect, it } from "vitest";

import {
  authErrorMessage,
  isValidEmail,
  isValidFullName,
  isValidOptionalPhone,
  normalizeEmail,
  normalizeFullName,
  normalizePhone,
  passwordValidationKey,
} from "./auth-forms";
import { API_ERROR_CODES, ApiRequestError } from "./http-client";

describe("auth form validation", () => {
  it("accepts normal email domains without limiting registration to Gmail", () => {
    expect(isValidEmail("teacher@gmail.com")).toBe(true);
    expect(isValidEmail("teacher@school.edu.kz")).toBe(true);
    expect(isValidEmail("teacher+math@қазақ.мектеп")).toBe(true);
    expect(normalizeEmail("  Teacher@Example.KZ ")).toBe("teacher@example.kz");
  });

  it("rejects malformed email addresses", () => {
    expect(isValidEmail("teacher")).toBe(false);
    expect(isValidEmail("teacher@localhost")).toBe(false);
    expect(isValidEmail("teacher..math@example.kz")).toBe(false);
    expect(isValidEmail("teacher@-school.kz")).toBe(false);
  });

  it("normalizes profile fields and keeps the phone optional", () => {
    expect(normalizeFullName("  Алия   Мұратқызы  ")).toBe("Алия Мұратқызы");
    expect(isValidFullName("А Қ")).toBe(true);
    expect(isValidFullName(" ")).toBe(false);
    expect(isValidOptionalPhone("")).toBe(true);
    expect(isValidOptionalPhone("+7 (701) 123-45-67")).toBe(true);
    expect(normalizePhone("+7 (701) 123-45-67")).toBe("+77011234567");
    expect(isValidOptionalPhone("123")).toBe(false);
  });

  it("matches the backend password byte limit", () => {
    expect(passwordValidationKey("1234567")).toBe("short");
    expect(passwordValidationKey("valid-pass-8")).toBeNull();
    expect(passwordValidationKey("я".repeat(37))).toBe("long");
  });
});

describe("auth error copy", () => {
  const backendError = (status: number, code: string) =>
    new ApiRequestError("raw technical message", status, { detail: { code, message: "raw" } });

  it("maps stable backend codes without exposing server diagnostics", () => {
    expect(authErrorMessage(backendError(400, "REGISTRATION_CODE_INVALID"), "ru", "register"))
      .toBe("Код не подошёл. Проверьте цифры и попробуйте ещё раз.");
    expect(authErrorMessage(backendError(400, "PASSWORD_RESET_TOKEN_EXPIRED"), "kk", "password-reset-confirm"))
      .toBe("Сілтеменің мерзімі аяқталды. Жаңа хат сұраңыз.");
    expect(authErrorMessage(backendError(503, "EMAIL_DELIVERY_UNAVAILABLE"), "ru", "registration-code"))
      .not.toContain("raw");
  });

  it("maps transport and credential failures to teacher-friendly copy", () => {
    expect(
      authErrorMessage(
        new ApiRequestError("Unable to reach server", 0, undefined, API_ERROR_CODES.NETWORK_ERROR),
        "ru",
        "login",
      ),
    ).toContain("Проверьте интернет");
    expect(authErrorMessage(new ApiRequestError("raw", 401), "kk", "login"))
      .toBe("Пошта немесе құпиясөз қате.");
  });
});
