import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { clearCachedCosts, getCachedCosts, loadTokenCosts, setCachedCosts } from "./tokenCache";

beforeEach(() => {
  const values = new Map<string, string>();
  vi.stubGlobal("window", {
    localStorage: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    },
  });
});

afterEach(() => {
  clearCachedCosts();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("required operation token pricing", () => {
  it("fetches the actual new price when a fresh nonempty Science cache lacks Coaching", async () => {
    setCachedCosts({ science_pro_generate: 91 });
    const fetch = vi.fn(async () => ({ coaching_generate: 37 }));
    await expect(loadTokenCosts(fetch, { requiredOperation: "coaching_generate" }))
      .resolves.toEqual({ science_pro_generate: 91, coaching_generate: 37 });
    expect(fetch).toHaveBeenCalledOnce();
    expect(getCachedCosts()).toEqual({ science_pro_generate: 91, coaching_generate: 37 });
  });

  it("reuses a fresh known-key price without fetching, including zero-priced operations", async () => {
    setCachedCosts({ coaching_generate: 0 });
    const fetch = vi.fn(async () => ({ coaching_generate: 45 }));
    await expect(loadTokenCosts(fetch, { requiredOperation: "coaching_generate" }))
      .resolves.toEqual({ coaching_generate: 0 });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("keeps legacy no-option cache behavior for other tools", async () => {
    setCachedCosts({ science_pro_generate: 91 });
    const fetch = vi.fn(async () => ({ coaching_generate: 37 }));
    await expect(loadTokenCosts(fetch)).resolves.toEqual({ science_pro_generate: 91 });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("preserves cached prices on failure and permits a new bounded explicit retry", async () => {
    setCachedCosts({ science_pro_generate: 91 });
    const fetch = vi.fn<() => Promise<Record<string, number>>>()
      .mockRejectedValueOnce(new Error("private upstream error"))
      .mockResolvedValueOnce({ coaching_generate: 43 });
    await expect(loadTokenCosts(fetch, { requiredOperation: "coaching_generate" })).rejects.toThrow();
    expect(getCachedCosts()).toEqual({ science_pro_generate: 91 });
    await expect(loadTokenCosts(fetch, { requiredOperation: "coaching_generate", force: true }))
      .resolves.toEqual({ science_pro_generate: 91, coaching_generate: 43 });
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("does not mark an incomplete server response fresh or invent a missing operation price", async () => {
    setCachedCosts({ science_pro_generate: 91 });
    await expect(loadTokenCosts(async () => ({ science_pro_generate: 92 }), { requiredOperation: "coaching_generate" }))
      .rejects.toThrow("Required operation price is unavailable");
    expect(getCachedCosts()).toEqual({ science_pro_generate: 91 });
  });

  it.each([-1, Number.NaN, Number.POSITIVE_INFINITY])("revalidates an invalid required cached price %s", async invalid => {
    setCachedCosts({ coaching_generate: invalid });
    const fetch = vi.fn(async () => ({ coaching_generate: 39 }));
    await expect(loadTokenCosts(fetch, { requiredOperation: "coaching_generate" }))
      .resolves.toEqual({ coaching_generate: 39 });
    expect(fetch).toHaveBeenCalledOnce();
  });

  it("retains stale known prices as fallback while attempting the server", async () => {
    vi.useFakeTimers();
    setCachedCosts({ coaching_generate: 31 });
    vi.advanceTimersByTime(3_600_001);
    const fetch = vi.fn(async () => { throw new Error("unavailable"); });
    await expect(loadTokenCosts(fetch, { requiredOperation: "coaching_generate" })).rejects.toThrow();
    expect(getCachedCosts()).toEqual({ coaching_generate: 31 });
    expect(fetch).toHaveBeenCalledOnce();
  });

  it("deduplicates concurrent missing-key fetches rather than launching parallel requests", async () => {
    setCachedCosts({ science_pro_generate: 91 });
    let resolve!: (costs: Record<string, number>) => void;
    const fetch = vi.fn(() => new Promise<Record<string, number>>(done => { resolve = done; }));
    const first = loadTokenCosts(fetch, { requiredOperation: "coaching_generate" });
    const second = loadTokenCosts(fetch, { requiredOperation: "coaching_generate" });
    resolve({ coaching_generate: 42 });
    await expect(first).resolves.toMatchObject({ coaching_generate: 42 });
    await expect(second).resolves.toMatchObject({ coaching_generate: 42 });
    expect(fetch).toHaveBeenCalledOnce();
  });

  it("wires the required price and safe retry only into Coaching", () => {
    const workspace = readFileSync(new URL("../features/coaching/CoachingWorkspace.tsx", import.meta.url), "utf8");
    const hook = readFileSync(new URL("../hooks/useTokens.ts", import.meta.url), "utf8");
    expect(workspace).toContain('useTokens({ requiredOperation: "coaching_generate" })');
    expect(workspace).toContain("onRetryCosts={() => void refreshCosts()}");
    expect(hook).toContain('setCostsError("costs_unavailable")');
    expect(hook).not.toContain('console.error("Failed to fetch token costs:');
  });
});
