import { afterEach, describe, expect, it, vi } from "vitest";

import {
  AUTH_HTTP_TIMEOUT_MS,
  confirmPasswordReset,
  getProfile,
  getToken,
  getRestoredSessionUser,
  getUser,
  login,
  logoutSession,
  refreshSession,
  register,
  requestPasswordReset,
  requestRegistrationCode,
  saveToken,
  saveUser,
} from "./api";
import {
  AUTH_LOGOUT_TOMBSTONE_KEY,
  AUTH_SESSION_REVISION_KEY,
  hasAuthLogoutTombstone,
  markAuthLogoutTombstone,
  markAuthSessionActive,
  subscribeToUnauthorized,
} from "./auth-session";
import { API_ERROR_CODES } from "./http-client";

function accessToken(userId: string, role = "teacher"): string {
  const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString("base64url");
  return `${encode({ alg: "none", typ: "JWT" })}.${encode({
    sub: userId,
    role,
    exp: Math.floor(Date.now() / 1000) + 3_600,
  })}.signature`;
}

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

function requestPath(call: unknown[]): string {
  return new URL(String(call[0])).pathname;
}

class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>();

  get length(): number {
    return this.values.size;
  }

  clear(): void {
    this.values.clear();
  }

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  key(index: number): string | null {
    return Array.from(this.values.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

function installBrowser(storage = new MemoryStorage()) {
  const target = new EventTarget() as Window;
  Object.defineProperty(target, "localStorage", { configurable: true, value: storage });
  vi.stubGlobal("window", target);

  let held = false;
  let lockTail = Promise.resolve<unknown>(undefined);
  const lockRequest = vi.fn((
    _name: string,
    _options: LockOptions,
    callback: () => Promise<unknown>,
  ) => {
    const result = lockTail.then(async () => {
      held = true;
      try {
        return await callback();
      } finally {
        held = false;
      }
    });
    lockTail = result.catch(() => undefined);
    return result;
  });
  vi.stubGlobal("navigator", { locks: { request: lockRequest } });
  return { storage, lockRequest, isHeld: () => held };
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
    const token = accessToken("teacher-1");
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ expires_in_seconds: 600, resend_after_seconds: 60 }, 202))
      .mockResolvedValueOnce(jsonResponse({ token, user_id: "teacher-1" }, 200));
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

    expect(requestPath(fetchMock.mock.calls[0])).toBe("/auth/registration-code/request");
    expect(requestBody(fetchMock.mock.calls[0])).toEqual({ email: "teacher@school.kz" });
    expect(requestPath(fetchMock.mock.calls[1])).toBe("/auth/register");
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
      jsonResponse({ token: accessToken("teacher-1"), user_id: "teacher-1" }, 200),
    );
    vi.stubGlobal("fetch", fetchMock);

    await login({ email: "teacher@example.kz", password: "existing-password" });

    expect(requestPath(fetchMock.mock.calls[0])).toBe("/auth/login");
    expect(requestBody(fetchMock.mock.calls[0])).toEqual({
      email: "teacher@example.kz",
      password: "existing-password",
    });
    expect(requestBody(fetchMock.mock.calls[0])).not.toHaveProperty("phone");
  });

  it("does not treat a rejected public login as an expired active session", async () => {
    installBrowser();
    const activeToken = accessToken("teacher-active");
    saveToken(activeToken);
    saveUser({ userId: "teacher-active", email: "active@example.kz" });
    markAuthSessionActive();
    const unauthorizedListener = vi.fn();
    const unsubscribe = subscribeToUnauthorized(unauthorizedListener);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
      jsonResponse({ detail: "Invalid email or password" }, 401),
    ));

    await expect(login({
      email: "other@example.kz",
      password: "wrong-password",
    })).rejects.toMatchObject({
      code: API_ERROR_CODES.UNAUTHORIZED,
      status: 401,
    });

    expect(unauthorizedListener).not.toHaveBeenCalled();
    expect(getToken()).toBe(activeToken);
    expect(getUser()).toMatchObject({ userId: "teacher-active" });
    expect(hasAuthLogoutTombstone()).toBe(false);
    unsubscribe();
  });

  it.each([
    {
      name: "login",
      path: "/auth/login",
      mutate: () => login({ email: "new@example.kz", password: "password" }),
    },
    {
      name: "registration",
      path: "/auth/register",
      mutate: () => register({
        email: "new@example.kz",
        password: "password",
        verification_code: "123456",
        full_name: "New Teacher",
      }),
    },
  ])("fails closed when a successful $name response is malformed", async ({ path, mutate }) => {
    installBrowser();
    saveToken(accessToken("teacher-active"));
    saveUser({ userId: "teacher-active", email: "active@example.kz" });
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("not-json", {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(mutate()).rejects.toMatchObject({
      code: API_ERROR_CODES.INVALID_RESPONSE,
      status: 200,
    });

    expect(fetchMock.mock.calls.map(requestPath)).toEqual([path, "/auth/logout"]);
    expect(getToken()).toBeNull();
    expect(getUser()).toBeNull();
    expect(hasAuthLogoutTombstone()).toBe(true);
  });

  it("does not replay a stale request under a different user's session", async () => {
    installBrowser();
    saveToken(accessToken("teacher-old"));
    saveUser({ userId: "teacher-old", email: "old@example.kz" });
    markAuthSessionActive();
    const unauthorizedListener = vi.fn();
    const unsubscribe = subscribeToUnauthorized(unauthorizedListener);
    let finishOldRequest!: (response: Response) => void;
    const newToken = accessToken("teacher-new");
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const path = requestPath([input, {}]);
      if (path === "/auth/me") {
        return new Promise<Response>((resolve) => {
          finishOldRequest = resolve;
        });
      }
      if (path === "/auth/login") {
        return Promise.resolve(jsonResponse({ token: newToken, user_id: "teacher-new" }, 200));
      }
      throw new Error(`Unexpected request: ${path}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    const staleRequest = getProfile();
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    await login({ email: "new@example.kz", password: "password" });
    finishOldRequest(jsonResponse({ detail: "Expired old session" }, 401));

    await expect(staleRequest).rejects.toMatchObject({
      code: API_ERROR_CODES.UNAUTHORIZED,
      status: 401,
    });
    expect(fetchMock.mock.calls.map(requestPath)).toEqual(["/auth/me", "/auth/login"]);
    expect(getToken()).toBe(newToken);
    expect(getUser()).toMatchObject({ userId: "teacher-new" });
    expect(unauthorizedListener).not.toHaveBeenCalled();
    unsubscribe();
  });

  it("uses generic reset request and token confirmation contracts", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ message: "generic" }, 202))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    await requestPasswordReset("teacher@example.kz");
    await confirmPasswordReset("secure-reset-token", "new-password-123");

    expect(requestPath(fetchMock.mock.calls[0])).toBe("/auth/password-reset/request");
    expect(requestBody(fetchMock.mock.calls[0])).toEqual({ email: "teacher@example.kz" });
    expect(requestPath(fetchMock.mock.calls[1])).toBe("/auth/password-reset/confirm");
    expect(requestBody(fetchMock.mock.calls[1])).toEqual({
      token: "secure-reset-token",
      new_password: "new-password-123",
    });
  });

  it("holds one Web Lock through logout HTTP and the next login's complete local commit", async () => {
    const { storage, lockRequest, isHeld } = installBrowser();
    const oldToken = accessToken("teacher-old");
    const newToken = accessToken("teacher-new");
    saveToken(oldToken);
    saveUser({ userId: "teacher-old" });

    const writesOutsideLock: string[] = [];
    const originalSet = storage.setItem.bind(storage);
    storage.setItem = (key, value) => {
      if (!isHeld()) writesOutsideLock.push(key);
      originalSet(key, value);
    };
    const originalRemove = storage.removeItem.bind(storage);
    storage.removeItem = (key) => {
      if (!isHeld()) writesOutsideLock.push(key);
      originalRemove(key);
    };

    let finishLogout!: (response: Response) => void;
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      if (requestPath([input, {}]) === "/auth/logout") {
        return new Promise<Response>((resolve) => {
          finishLogout = resolve;
        });
      }
      return Promise.resolve(jsonResponse({ token: newToken, user_id: "teacher-new" }, 200));
    });
    vi.stubGlobal("fetch", fetchMock);

    const pendingLogout = logoutSession();
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const pendingLogin = login({ email: "new@example.kz", password: "password" });
    await Promise.resolve();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(getToken()).toBeNull();
    expect(hasAuthLogoutTombstone()).toBe(true);

    finishLogout(new Response(null, { status: 204 }));
    await pendingLogout;
    await expect(pendingLogin).resolves.toEqual({ token: newToken, user_id: "teacher-new" });

    expect(fetchMock.mock.calls.map(requestPath)).toEqual(["/auth/logout", "/auth/login"]);
    expect(lockRequest).toHaveBeenCalledTimes(2);
    expect(writesOutsideLock).toEqual([]);
    expect(getToken()).toBe(newToken);
    expect(getUser()).toMatchObject({ userId: "teacher-new", email: "new@example.kz" });
    expect(hasAuthLogoutTombstone()).toBe(false);
    expect(storage.getItem(AUTH_SESSION_REVISION_KEY)).not.toBeNull();
  });

  it("fails closed before cookie mutation when Web Locks are unavailable", async () => {
    const storage = new MemoryStorage();
    const target = new EventTarget() as Window;
    Object.defineProperty(target, "localStorage", { configurable: true, value: storage });
    vi.stubGlobal("window", target);
    vi.stubGlobal("navigator", {});
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(login({ email: "teacher@example.kz", password: "password" })).rejects.toMatchObject({
      code: "AUTH_SESSION_COORDINATION_UNAVAILABLE",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects unusable or cross-user JWTs from login without committing them", async () => {
    const { storage } = installBrowser();
    const mismatched = accessToken("different-user");
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ token: mismatched, user_id: "teacher-1" }, 200))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(login({ email: "teacher@example.kz", password: "password" })).rejects.toMatchObject({
      code: API_ERROR_CODES.INVALID_RESPONSE,
    });
    expect(getToken()).toBeNull();
    expect(getUser()).toBeNull();
    expect(storage.getItem(AUTH_LOGOUT_TOMBSTONE_KEY)).not.toBeNull();
    expect(fetchMock.mock.calls.map(requestPath)).toEqual(["/auth/login", "/auth/logout"]);
  });

  it("serializes an in-flight login before password reset and leaves the final state logged out", async () => {
    const { lockRequest } = installBrowser();
    const token = accessToken("teacher-1");
    let finishLogin!: (response: Response) => void;
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      if (requestPath([input, {}]) === "/auth/login") {
        return new Promise<Response>((resolve) => {
          finishLogin = resolve;
        });
      }
      return Promise.resolve(new Response(null, { status: 204 }));
    });
    vi.stubGlobal("fetch", fetchMock);

    const pendingLogin = login({ email: "teacher@example.kz", password: "password" });
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const pendingReset = confirmPasswordReset("reset-token", "new-password-123");
    await Promise.resolve();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    finishLogin(jsonResponse({ token, user_id: "teacher-1" }, 200));
    await pendingLogin;
    await pendingReset;

    expect(fetchMock.mock.calls.map(requestPath)).toEqual(["/auth/login", "/auth/password-reset/confirm"]);
    expect(lockRequest).toHaveBeenCalledTimes(2);
    expect(getToken()).toBeNull();
    expect(getUser()).toBeNull();
    expect(hasAuthLogoutTombstone()).toBe(true);
  });

  it("commits a validated refresh token, user cache and revision under the Web Lock", async () => {
    const { storage, lockRequest } = installBrowser();
    const token = accessToken("teacher-1", "admin");
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({ token, user_id: "teacher-1" }, 200),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(refreshSession()).resolves.toEqual({ token, user_id: "teacher-1" });

    expect(fetchMock.mock.calls.map(requestPath)).toEqual(["/auth/refresh"]);
    expect(lockRequest).toHaveBeenCalledTimes(1);
    expect(getToken()).toBe(token);
    expect(getUser()).toMatchObject({ userId: "teacher-1", role: "admin" });
    expect(storage.getItem(AUTH_SESSION_REVISION_KEY)).not.toBeNull();
  });

  it("keeps a logout tombstone after both revocation attempts fail and blocks reload refresh", async () => {
    installBrowser();
    saveToken(accessToken("teacher-1"));
    saveUser({ userId: "teacher-1" });
    const fetchMock = vi.fn().mockRejectedValue(new TypeError("offline"));
    vi.stubGlobal("fetch", fetchMock);

    await expect(logoutSession()).rejects.toMatchObject({ code: API_ERROR_CODES.NETWORK_ERROR });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(getToken()).toBeNull();
    expect(getUser()).toBeNull();
    expect(hasAuthLogoutTombstone()).toBe(true);

    await expect(refreshSession()).resolves.toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("does not restore credentials left behind by a crash after writing the logout tombstone", () => {
    installBrowser();
    const token = accessToken("teacher-1");
    saveToken(token);
    saveUser({ userId: "teacher-1", role: "teacher" });

    // Simulate a process exit after the first synchronous logout write but
    // before clearToken/clearUser can complete.
    markAuthLogoutTombstone("explicit_logout");

    expect(getToken()).toBe(token);
    expect(getUser()).toMatchObject({ userId: "teacher-1" });
    expect(getRestoredSessionUser()).toBeNull();
  });
});
