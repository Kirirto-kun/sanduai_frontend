import { afterEach, describe, expect, it, vi } from "vitest";

import {
  deleteAdminUser,
  getAdminUsers,
  resetUserTokens,
  revokeSubscriptionFromUser,
} from "./api";

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

describe("admin user mutation API", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("uses the subscription DELETE contract", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({
      user_id: "teacher/1",
      subscription_plan: "free",
      subscription_end: null,
      has_subscription: false,
      balance: 17,
      message: "ok",
    }));
    vi.stubGlobal("fetch", fetchMock);

    await revokeSubscriptionFromUser("teacher/1");

    expect(new URL(String(fetchMock.mock.calls[0]?.[0])).pathname)
      .toBe("/api/admin/users/teacher%2F1/subscription");
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({ method: "DELETE" });
  });

  it("uses the token-reset POST contract", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({
      user_id: "teacher-1",
      balance: 0,
      subscription_plan: "premium",
      subscription_end: "2026-10-03T00:00:00Z",
      has_subscription: true,
      message: "ok",
    }));
    vi.stubGlobal("fetch", fetchMock);

    await resetUserTokens("teacher-1");

    expect(new URL(String(fetchMock.mock.calls[0]?.[0])).pathname)
      .toBe("/api/admin/users/teacher-1/tokens/reset");
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({ method: "POST" });
  });

  it("uses the user DELETE contract", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({
      user_id: "teacher-1",
      balance: 0,
      subscription_plan: "free",
      subscription_end: null,
      has_subscription: false,
      message: "deleted",
      deleted: true,
    }));
    vi.stubGlobal("fetch", fetchMock);

    await deleteAdminUser("teacher-1");

    expect(new URL(String(fetchMock.mock.calls[0]?.[0])).pathname)
      .toBe("/api/admin/users/teacher-1");
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({ method: "DELETE" });
  });

  it("forwards an AbortSignal when loading users so stale searches can be cancelled", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ users: [], total: 0 }));
    vi.stubGlobal("fetch", fetchMock);
    const controller = new AbortController();

    await getAdminUsers(50, 0, "teacher", controller.signal);

    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({ signal: controller.signal });
  });
});
