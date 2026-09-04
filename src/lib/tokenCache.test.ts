import { afterEach, describe, expect, it, vi } from "vitest";

import { currentSessionUserId } from "../hooks/useTokens";
import { saveToken } from "./api";
import { markAuthLogoutTombstone } from "./auth-session";
import {
  clearCachedBalance,
  getCachedBalance,
  getOrCreateBalanceFetchPromise,
  getSubscriptionExpiryTimerDelay,
  isBalanceCacheValid,
  parseSubscriptionEndTimestamp,
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
  it("treats a timezone-naive backend subscription timestamp as UTC", () => {
    expect(parseSubscriptionEndTimestamp("2026-09-04T11:57:47.23667"))
      .toBe(Date.parse("2026-09-04T11:57:47.23667Z"));
  });

  it("preserves an explicit subscription timezone", () => {
    const expected = Date.parse("2026-09-04T08:00:00Z");
    expect(parseSubscriptionEndTimestamp("2026-09-04T08:00:00Z")).toBe(expected);
    expect(parseSubscriptionEndTimestamp("2026-09-04T13:00:00+05:00")).toBe(expected);
    expect(parseSubscriptionEndTimestamp("2026-09-04T04:00:00-04:00")).toBe(expected);
  });

  it("uses checkpoint timers without expiring a long subscription early", () => {
    const now = Date.parse("2026-09-04T08:00:00Z");
    const ninetyDaysLater = "2026-12-03T08:00:00";
    expect(getSubscriptionExpiryTimerDelay(ninetyDaysLater, now)).toBe(2_147_000_000);
    expect(getSubscriptionExpiryTimerDelay(ninetyDaysLater, now + 2_147_000_000))
      .toBe(2_147_000_000);
  });

  it("returns zero only after the actual UTC expiry boundary", () => {
    const expiresAt = "2026-09-04T08:00:10";
    expect(getSubscriptionExpiryTimerDelay(expiresAt, Date.parse("2026-09-04T08:00:09.999Z")))
      .toBe(1_001);
    expect(getSubscriptionExpiryTimerDelay(expiresAt, Date.parse("2026-09-04T08:00:10Z")))
      .toBe(0);
  });

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

  it("fails closed from cache as soon as a subscription has expired", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-04T08:00:00Z"));
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
      has_subscription: true,
      subscription_end: "2026-09-04T07:59:59",
      subscription_plan: "premium",
    });

    expect(getCachedBalance("teacher-1")).toMatchObject({
      has_subscription: false,
      subscription_plan: "free",
    });
    expect(isBalanceCacheValid("teacher-1")).toBe(true);
    vi.useRealTimers();
  });
});
