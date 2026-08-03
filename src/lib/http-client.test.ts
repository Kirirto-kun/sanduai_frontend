import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  markAuthSessionActive,
  resetAuthSessionNotifications,
  subscribeToUnauthorized,
} from "./auth-session";
import {
  API_ERROR_CODES,
  configureAuthRefresh,
  requestJson,
  resetAuthRefreshForTests,
} from "./http-client";

describe("requestJson", () => {
  beforeEach(() => {
    resetAuthSessionNotifications();
    resetAuthRefreshForTests();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    resetAuthSessionNotifications();
    resetAuthRefreshForTests();
  });

  it("returns a stable timeout error when the deadline expires", async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      "fetch",
      vi.fn((_input: RequestInfo | URL, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          const rejectAsAborted = () => reject(new DOMException("Aborted", "AbortError"));
          if (init?.signal?.aborted) rejectAsAborted();
          else init?.signal?.addEventListener("abort", rejectAsAborted, { once: true });
        }),
      ),
    );

    const request = requestJson("https://api.example.test/slow", {}, { timeoutMs: 25 });
    const assertion = expect(request).rejects.toMatchObject({
      code: API_ERROR_CODES.TIMEOUT,
      status: 0,
    });

    await vi.advanceTimersByTimeAsync(25);
    await assertion;
  });

  it("rejects malformed successful responses instead of returning an empty object", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response("not-json", {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    await expect(requestJson("https://api.example.test/data")).rejects.toMatchObject({
      code: API_ERROR_CODES.INVALID_RESPONSE,
      status: 200,
    });
  });

  it("shows the safe nested provider message instead of an object placeholder", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            detail: {
              code: "VOICE_GENERATION_FAILED",
              message: "Дыбысты жасау уақытша мүмкін болмады",
            },
          }),
          {
            status: 502,
            headers: { "Content-Type": "application/json" },
          },
        ),
      ),
    );

    await expect(requestJson("https://api.example.test/audio")).rejects.toMatchObject({
      message: "Дыбысты жасау уақытша мүмкін болмады",
      status: 502,
    });
  });

  it("does not retry a failed request", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      requestJson("https://api.example.test/paid-operation", {
        method: "POST",
        body: JSON.stringify({ create: true }),
      }),
    ).rejects.toMatchObject({
      code: API_ERROR_CODES.NETWORK_ERROR,
      status: 0,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("emits one logout notification for a burst of 401 responses", async () => {
    const listener = vi.fn();
    const unsubscribe = subscribeToUnauthorized(listener);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify({ detail: "Expired session" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          }),
        ),
      ),
    );

    await expect(requestJson("https://api.example.test/first")).rejects.toMatchObject({
      code: API_ERROR_CODES.UNAUTHORIZED,
      status: 401,
    });
    await expect(requestJson("https://api.example.test/second")).rejects.toMatchObject({
      code: API_ERROR_CODES.UNAUTHORIZED,
      status: 401,
    });
    expect(listener).toHaveBeenCalledTimes(1);

    markAuthSessionActive();
    await expect(requestJson("https://api.example.test/third")).rejects.toMatchObject({
      code: API_ERROR_CODES.UNAUTHORIZED,
      status: 401,
    });
    expect(listener).toHaveBeenCalledTimes(2);
    unsubscribe();
  });

  it("coordinates concurrent refreshes and retries each request exactly once", async () => {
    const refresh = vi.fn().mockResolvedValue("fresh-access-token");
    configureAuthRefresh(refresh);
    const fetchMock = vi.fn().mockImplementation(
      (_input: RequestInfo | URL, init?: RequestInit) => {
        const authorization = new Headers(init?.headers).get("Authorization");
        if (authorization === "Bearer fresh-access-token") {
          return Promise.resolve(
            new Response(JSON.stringify({ ok: true }), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }),
          );
        }
        return Promise.resolve(
          new Response(JSON.stringify({ detail: "Token expired" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          }),
        );
      },
    );
    vi.stubGlobal("fetch", fetchMock);

    const init = {
      method: "POST",
      headers: {
        Authorization: "Bearer expired-access-token",
        "Content-Type": "application/json",
        "Idempotency-Key": "stable-operation-id",
      },
      body: JSON.stringify({ paid: true }),
    };
    const [first, second] = await Promise.all([
      requestJson<{ ok: boolean }>("https://api.example.test/paid", init),
      requestJson<{ ok: boolean }>("https://api.example.test/paid", init),
    ]);

    expect(first).toEqual({ ok: true });
    expect(second).toEqual({ ok: true });
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(4);
    for (const [, retryInit] of fetchMock.mock.calls.slice(2)) {
      const headers = new Headers(retryInit?.headers);
      expect(headers.get("Authorization")).toBe("Bearer fresh-access-token");
      expect(headers.get("Idempotency-Key")).toBe("stable-operation-id");
    }
  });

  it("does not recurse when refresh fails and signals logout once", async () => {
    const listener = vi.fn();
    subscribeToUnauthorized(listener);
    const refresh = vi.fn().mockRejectedValue(new Error("refresh unavailable"));
    configureAuthRefresh(refresh);
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ detail: "Token expired" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      requestJson("https://api.example.test/protected", {
        headers: { Authorization: "Bearer expired-access-token" },
      }),
    ).rejects.toMatchObject({ status: 401 });

    expect(refresh).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
