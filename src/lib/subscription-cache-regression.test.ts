import { afterEach, describe, expect, it, vi } from "vitest";

import {
  clearCachedBalance,
  getCachedBalance,
  isBalanceCacheValid,
  setCachedBalance,
} from "./tokenCache";

function stubLocalStorage(): Map<string, string> {
  const values = new Map<string, string>();
  vi.stubGlobal("window", {
    localStorage: {
      getItem: vi.fn((key: string) => values.get(key) ?? null),
      setItem: vi.fn((key: string, value: string) => values.set(key, value)),
      removeItem: vi.fn((key: string) => values.delete(key)),
    },
  });
  return values;
}

afterEach(() => {
  clearCachedBalance();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("subscription balance cache", () => {
  it("keeps a known subscription immediately reusable for the 30-second navigation window", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-04T08:00:00Z"));
    stubLocalStorage();

    setCachedBalance("teacher-1", {
      balance: 250,
      has_subscription: true,
      subscription_end: "2026-09-10T08:00:00",
      subscription_plan: "premium",
    });

    expect(getCachedBalance("teacher-1")).toMatchObject({
      user_id: "teacher-1",
      balance: 250,
      has_subscription: true,
      subscription_plan: "premium",
    });
    expect(isBalanceCacheValid("teacher-1")).toBe(true);

    vi.advanceTimersByTime(29_999);
    expect(isBalanceCacheValid("teacher-1")).toBe(true);

    vi.advanceTimersByTime(2);
    expect(isBalanceCacheValid("teacher-1")).toBe(false);
    expect(getCachedBalance("teacher-1")?.has_subscription).toBe(true);
  });

  it("fails closed at the subscription end even while the balance TTL is still fresh", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-04T08:00:00Z"));
    stubLocalStorage();

    setCachedBalance("teacher-1", {
      balance: 250,
      has_subscription: true,
      subscription_end: "2026-09-04T08:00:10",
      subscription_plan: "premium",
    });

    vi.advanceTimersByTime(10_001);

    expect(isBalanceCacheValid("teacher-1")).toBe(true);
    expect(getCachedBalance("teacher-1")).toMatchObject({
      balance: 250,
      has_subscription: false,
      subscription_plan: "free",
    });
  });
});
