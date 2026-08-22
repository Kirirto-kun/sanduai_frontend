import { afterEach, describe, expect, it, vi } from "vitest";

import {
  AUTH_HTTP_TIMEOUT_MS,
  confirmPasswordReset,
  login,
  register,
  requestPasswordReset,
  requestRegistrationCode,
} from "./api";
import { API_ERROR_CODES } from "./http-client";

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function requestBody(call: unknown[]): unknown {
  const init = call[1] as RequestInit;
  return JSON.parse(String(init.body));
}

describe("email authentication API contract", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("keeps authentication requests on the short deadline", async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      "fetch",
      vi.fn((_input: RequestInfo | URL, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          const abort = () => reject(new DOMException("Aborted", "AbortError"));
          if (init?.signal?.aborted) abort();
          else init?.signal?.addEventListener("abort", abort, { once: true });
        }),
      ),
    );

    const request = login({ email: "teacher@example.kz", password: "password" });
    const assertion = expect(request).rejects.toMatchObject({
      code: API_ERROR_CODES.TIMEOUT,
      status: 0,
    });

    await vi.advanceTimersByTimeAsync(AUTH_HTTP_TIMEOUT_MS);
    await assertion;
  });

  it("uses the email-code registration endpoints and exact payload names", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ expires_in_seconds: 600, resend_after_seconds: 60 }, 202))
      .mockResolvedValueOnce(jsonResponse({ token: "header.payload.signature", user_id: "teacher-1" }, 200));
    vi.stubGlobal("fetch", fetchMock);

    await expect(requestRegistrationCode("teacher@school.kz")).resolves.toEqual({
      expires_in_seconds: 600,
      resend_after_seconds: 60,
    });
    await register({
      email: "teacher@school.kz",
      password: "strong-password",
      verification_code: "123456",
      full_name: "Алия Мұратқызы",
    });

    expect(String(fetchMock.mock.calls[0][0])).toBe("http://127.0.0.1:8000/auth/registration-code/request");
    expect(requestBody(fetchMock.mock.calls[0])).toEqual({ email: "teacher@school.kz" });
    expect(String(fetchMock.mock.calls[1][0])).toBe("http://127.0.0.1:8000/auth/register");
    expect(requestBody(fetchMock.mock.calls[1])).toEqual({
      email: "teacher@school.kz",
      password: "strong-password",
      verification_code: "123456",
      full_name: "Алия Мұратқызы",
    });
    expect(requestBody(fetchMock.mock.calls[1])).not.toHaveProperty("phone");
    expect((fetchMock.mock.calls[1][1] as RequestInit).credentials).toBe("include");
  });

  it("logs in only with email and password", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({ token: "header.payload.signature", user_id: "teacher-1" }, 200),
    );
    vi.stubGlobal("fetch", fetchMock);

    await login({ email: "teacher@example.kz", password: "existing-password" });

    expect(String(fetchMock.mock.calls[0][0])).toBe("http://127.0.0.1:8000/auth/login");
    expect(requestBody(fetchMock.mock.calls[0])).toEqual({
      email: "teacher@example.kz",
      password: "existing-password",
    });
    expect(requestBody(fetchMock.mock.calls[0])).not.toHaveProperty("phone");
  });

  it("uses generic reset request and token confirmation contracts", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ message: "generic" }, 202))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    await requestPasswordReset("teacher@example.kz");
    await confirmPasswordReset("secure-reset-token", "new-password-123");

    expect(String(fetchMock.mock.calls[0][0])).toBe("http://127.0.0.1:8000/auth/password-reset/request");
    expect(requestBody(fetchMock.mock.calls[0])).toEqual({ email: "teacher@example.kz" });
    expect(String(fetchMock.mock.calls[1][0])).toBe("http://127.0.0.1:8000/auth/password-reset/confirm");
    expect(requestBody(fetchMock.mock.calls[1])).toEqual({
      token: "secure-reset-token",
      new_password: "new-password-123",
    });
  });
});
