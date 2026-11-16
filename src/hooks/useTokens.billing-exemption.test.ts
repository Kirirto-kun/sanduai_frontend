// @vitest-environment happy-dom
import { act, createElement, useEffect } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useTokens } from "./useTokens";
import { clearToken, saveToken } from "@/lib/api";
import { markAuthLogoutTombstone, publishAuthSessionChange } from "@/lib/auth-session";
import { clearCachedBalance, clearCachedCosts, getCachedBalance, setCachedBalance } from "@/lib/tokenCache";

const api = vi.hoisted(() => ({ balance: vi.fn(), costs: vi.fn() }));
vi.mock("@/lib/api", async (original) => ({
  ...await original<typeof import("@/lib/api")>(),
  getTokenBalance: api.balance,
  getTokenCosts: api.costs,
}));

function accessToken(userId: string, role = "user") {
  const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString("base64url");
  return `${encode({ alg: "none" })}.${encode({ sub: userId, role, exp: Math.floor(Date.now() / 1000) + 3600 })}.signature`;
}

function balanceResponse(userId: string, billingExempt?: unknown) {
  return { user_id: userId, balance: 0, has_subscription: false, subscription_end: null, subscription_plan: "free", billing_exempt: billingExempt };
}

let current: ReturnType<typeof useTokens>;
function BalanceProbe() {
  const tokens = useTokens();
  useEffect(() => { current = tokens; }, [tokens]);
  return createElement("output", null, String(tokens.billingExempt));
}
let root: Root;
let host: HTMLDivElement;
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  localStorage.clear(); clearCachedBalance(); clearCachedCosts();
  api.balance.mockReset().mockResolvedValue(balanceResponse("admin", true));
  api.costs.mockReset().mockResolvedValue({ costs: { kmzh_generate: 40, parent_meeting_generate: 30, kornekilik_generate: 50 } });
  saveToken(accessToken("admin"));
  host = document.createElement("div"); document.body.append(host); root = createRoot(host);
});
afterEach(async () => {
  await act(async () => root.unmount()); host.remove();
  clearCachedBalance(); clearCachedCosts(); localStorage.clear();
});
async function mount() { await act(async () => root.render(createElement(BalanceProbe))); }

describe("server-confirmed generation billing exemption", () => {
  it("enables known lesson operations at zero balance without replacing balance or public prices", async () => {
    await mount();
    expect(current.billingExempt).toBe(true);
    expect(current.balance).toBe(0);
    expect(current.costs.kmzh_generate).toBe(40);
    expect(current.checkBalance("kmzh_generate")).toBe(true);
    expect(current.checkBalance("unknown_operation")).toBe(false);
    expect(getCachedBalance("admin")).toMatchObject({ billing_exempt: true, balance: 0 });
  });

  it.each([undefined, false, "true"])("does not grant exemption from an admin JWT when the server returns %s", async (flag) => {
    saveToken(accessToken("admin", "admin"));
    api.balance.mockResolvedValue(balanceResponse("admin", flag));
    await mount();
    expect(current.billingExempt).toBe(false);
    expect(current.checkBalance("kmzh_generate")).toBe(false);
  });

  it("does not reuse the previous account's exemption while a new balance is pending", async () => {
    await mount();
    expect(current.billingExempt).toBe(true);
    let resolve!: (value: ReturnType<typeof balanceResponse>) => void;
    api.balance.mockImplementation(() => new Promise((done) => { resolve = done; }));
    await act(async () => { saveToken(accessToken("teacher")); publishAuthSessionChange(); });
    expect(current.billingExempt).toBe(false);
    expect(current.checkBalance("kmzh_generate")).toBe(false);
    await act(async () => resolve(balanceResponse("teacher", false)));
    expect(current.billingExempt).toBe(false);
    expect(getCachedBalance("teacher")).toMatchObject({ billing_exempt: false });
  });

  it("clears exemption on logout and cannot regain it from a late response", async () => {
    await mount();
    let resolve!: (value: ReturnType<typeof balanceResponse>) => void;
    api.balance.mockImplementation(() => new Promise((done) => { resolve = done; }));
    let pending!: Promise<void>;
    await act(async () => { pending = current.refreshBalance(); });
    await act(async () => { clearToken(); markAuthLogoutTombstone("explicit_logout"); publishAuthSessionChange(); });
    expect(current.billingExempt).toBe(false);
    await act(async () => { resolve(balanceResponse("admin", true)); await pending; });
    expect(current.billingExempt).toBe(false);
    expect(getCachedBalance("admin")).toBeNull();
  });

  it("does not retain a stale exemption when refreshing the account fails", async () => {
    setCachedBalance("admin", { balance: 0, billing_exempt: true, has_subscription: false, subscription_end: null, subscription_plan: "free" });
    const cached = JSON.parse(localStorage.getItem("sanduai_token_balance")!);
    localStorage.setItem("sanduai_token_balance", JSON.stringify({ ...cached, timestamp: Date.now() - 60_000 }));
    api.balance.mockRejectedValue(new Error("offline"));
    await mount();
    expect(current.balance).toBe(0);
    expect(current.billingExempt).toBe(false);
    expect(current.checkBalance("kmzh_generate")).toBe(false);
  });
});
