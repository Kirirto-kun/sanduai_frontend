// @vitest-environment happy-dom
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import DashboardLayout from "../layout";
import CoursesPage from "./courses/page";
import VisualAidsPage from "./visual-aids/page";
import { translations } from "@/i18n/translations";

const account = vi.hoisted(() => ({ role: "user", subscription: false as boolean | null, billingExempt: false }));
const api = vi.hoisted(() => ({ visuals: vi.fn(), categories: vi.fn() }));
vi.mock("@/lib/api", async (original) => ({ ...await original<typeof import("@/lib/api")>(), getVisuals: api.visuals, getVisualCategories: api.categories }));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ user: { userId: "library-account", role: account.role }, isAuthenticated: true, loading: false, logout: () => {} }) }));
vi.mock("@/hooks/useTokens", () => ({ useTokens: () => ({ balance: 0, billingExempt: account.billingExempt, costs: {}, loading: false, error: null, hasSubscription: account.subscription, subscriptionPlan: "free", refreshBalance: async () => {}, refreshBalanceIfStale: async () => {} }) }));
vi.mock("@/hooks/useSegment", () => ({ useSegment: () => ["school", () => {}] }));
vi.mock("@/i18n/LanguageContext", () => ({ useLanguage: () => ({ language: "ru", setLanguage: () => {} }), useTranslations: () => translations.ru }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: () => {}, push: () => {} }), usePathname: () => "/dashboard/library/catalog", useSearchParams: () => new URLSearchParams() }));

let cache: QueryClient;
let mounted: Root | null = null;
let host: HTMLDivElement | null = null;
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  account.role = "user"; account.subscription = false; account.billingExempt = false;
  api.visuals.mockReset().mockResolvedValue({ items: [], total: 0 }); api.categories.mockReset().mockResolvedValue([]);
  cache = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
});
afterEach(async () => { if (mounted) await act(async () => mounted!.unmount()); host?.remove(); mounted = null; host = null; cache.clear(); });
function page(component: typeof CoursesPage | typeof VisualAidsPage) {
  return renderToStaticMarkup(createElement(QueryClientProvider, { client: cache }, createElement(component)));
}

describe("admin subscription library access", () => {
  it.each([false, null])("renders library children for a promoted account without relogin and subscription %s", (subscription) => {
    account.billingExempt = true; account.subscription = subscription;
    const html = renderToStaticMarkup(createElement(DashboardLayout, null, createElement("p", null, "Library content available")));
    expect(html).toContain("Library content available");
    expect(html).not.toContain("Для готовых материалов нужна подписка");
    expect(html).not.toContain("нужна подписка");
  });
  it("preserves the ordinary account's library subscription gate", () => {
    const html = renderToStaticMarkup(createElement(DashboardLayout, null, createElement("p", null, "Library content available")));
    expect(html).not.toContain("Library content available");
    expect(html).toContain("Для готовых материалов нужна подписка");
  });
  it("does not retain library access from a stale admin token after server demotion", () => {
    account.role = "admin";
    const html = renderToStaticMarkup(createElement(DashboardLayout, null, createElement("p", null, "Library content available")));
    expect(html).not.toContain("Library content available");
    expect(html).toContain("Для готовых материалов нужна подписка");
    expect(html).toContain("нужна подписка");
  });
  it.each([CoursesPage, VisualAidsPage])("does not reapply a subscription block inside an admin library page", (component) => {
    account.billingExempt = true;
    expect(page(component)).not.toContain("Требуется подписка");
  });
  it.each([CoursesPage, VisualAidsPage])("retains the page's subscription block for ordinary accounts", (component) => {
    expect(page(component)).toContain("Требуется подписка");
  });
  it.each([CoursesPage, VisualAidsPage])("blocks a stale admin token when the server does not confirm exemption", (component) => {
    account.role = "admin";
    expect(page(component)).toContain("Требуется подписка");
  });
  it("fetches visual materials after server promotion without a new token and hides them after demotion", async () => {
    host = document.createElement("div"); document.body.append(host); mounted = createRoot(host);
    await act(async () => mounted!.render(createElement(VisualAidsPage)));
    expect(api.visuals).not.toHaveBeenCalled();
    account.billingExempt = true;
    await act(async () => mounted!.render(createElement(VisualAidsPage)));
    expect(api.visuals).toHaveBeenCalledOnce();
    expect(host.textContent).not.toContain("Требуется подписка");
    account.role = "admin"; account.billingExempt = false;
    await act(async () => mounted!.render(createElement(VisualAidsPage)));
    expect(host.textContent).toContain("Требуется подписка");
    expect(api.visuals).toHaveBeenCalledOnce();
  });
});
