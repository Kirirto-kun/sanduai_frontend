import { afterEach, describe, expect, it, vi } from "vitest";

import { currentSessionUserId } from "../hooks/useTokens";
import { saveToken } from "./api";
import { markAuthLogoutTombstone } from "./auth-session";
import {
  clearCachedBalance,
  getCachedBalance,
  getOrCreateBalanceFetchPromise,
  setCachedBalance,
} from "./tokenCache";

type BalanceSnapshot = {
  user_id: string;
  balance: number;
  has_subscription: boolean;
  subscription_end: string | null;
  subscription_plan: "free" | "premium" | null;
  timestamp: number;
};

function snapshot(userId: string, balance: number): BalanceSnapshot {
  return {
    user_id: userId,
    balance,
    has_subscription: false,
    subscription_end: null,
    subscription_plan: "free",
    timestamp: Date.now(),
  };
}

function accessToken(userId: string): string {
  const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString("base64url");
  return `${encode({ alg: "none", typ: "JWT" })}.${encode({
    sub: userId,
    exp: Math.floor(Date.now() / 1000) + 3_600,
  })}.signature`;
}

afterEach(() => {
  clearCachedBalance();
  vi.unstubAllGlobals();
});

describe("token balance request deduplication", () => {
  it("does not let an obsolete request clear a newer in-flight request", async () => {
    vi.stubGlobal("window", {
      localStorage: { removeItem: vi.fn() },
    });

    let resolveFirst!: (value: BalanceSnapshot) => void;
    const first = getOrCreateBalanceFetchPromise(
      "teacher-1",
      () => new Promise((resolve) => { resolveFirst = resolve; }),
    );

    clearCachedBalance();
    let resolveSecond!: (value: BalanceSnapshot) => void;
    const second = getOrCreateBalanceFetchPromise(
      "teacher-1",
      () => new Promise((resolve) => { resolveSecond = resolve; }),
    );

    resolveFirst(snapshot("teacher-1", 10));
    await first;

    const unexpectedFetch = vi.fn(async () => snapshot("teacher-1", 999));
    const deduplicated = getOrCreateBalanceFetchPromise("teacher-1", unexpectedFetch);
    expect(deduplicated).toBe(second);
    expect(unexpectedFetch).not.toHaveBeenCalled();

    resolveSecond(snapshot("teacher-1", 150));
    await expect(deduplicated).resolves.toMatchObject({ balance: 150 });
  });

  it("does not deduplicate balance requests across users", async () => {
    const firstFetch = vi.fn(async () => snapshot("teacher-1", 10));
    const secondFetch = vi.fn(async () => snapshot("teacher-2", 150));

    const [first, second] = await Promise.all([
      getOrCreateBalanceFetchPromise("teacher-1", firstFetch),
      getOrCreateBalanceFetchPromise("teacher-2", secondFetch),
    ]);

    expect(first.user_id).toBe("teacher-1");
    expect(second.user_id).toBe("teacher-2");
    expect(firstFetch).toHaveBeenCalledTimes(1);
    expect(secondFetch).toHaveBeenCalledTimes(1);
  });

  it("rejects a cached balance belonging to another JWT subject", () => {
    const values = new Map<string, string>();
    vi.stubGlobal("window", {
      localStorage: {
        getItem: (key: string) => values.get(key) ?? null,
        setItem: (key: string, value: string) => values.set(key, value),
        removeItem: (key: string) => values.delete(key),
      },
    });

    setCachedBalance("teacher-1", {
      balance: 150,
      has_subscription: false,
      subscription_end: null,
      subscription_plan: "free",
    });

    expect(getCachedBalance("teacher-2")).toBeNull();
    expect(getCachedBalance("teacher-1")).toBeNull();
  });

  it("does not expose a tombstoned session to the balance hook", () => {
    const values = new Map<string, string>();
    vi.stubGlobal("window", {
      localStorage: {
        getItem: (key: string) => values.get(key) ?? null,
        setItem: (key: string, value: string) => values.set(key, value),
        removeItem: (key: string) => values.delete(key),
      },
    });
    saveToken(accessToken("teacher-1"));

    expect(currentSessionUserId()).toBe("teacher-1");
    markAuthLogoutTombstone("explicit_logout");
    expect(currentSessionUserId()).toBeNull();
  });
});
