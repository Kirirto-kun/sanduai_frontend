// @vitest-environment happy-dom
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Page from "@/app/dashboard/ai/image-generation/page";
import type { GenerationJob } from "@/lib/api";

const external = vi.hoisted(() => ({
  read: vi.fn(), enqueue: vi.fn(), replace: vi.fn(), refreshBalance: vi.fn(),
  errorMessage: () => "Не удаётся проверить статус. Повторите проверку.",
  jobId: "30bdc3b2-41e6-4399-877c-cbab8e93a5d9",
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: external.replace }), useSearchParams: () => new URLSearchParams(`job=${external.jobId}`) }));
vi.mock("@/i18n/LanguageContext", async () => { const { translations } = await import("@/i18n/translations"); return { useLanguage: () => ({ language: "ru" }), useTranslations: () => translations.ru }; });
vi.mock("@/hooks/useTokens", () => ({ currentSessionUserId: () => "owner-a", useTokens: () => ({ refreshBalance: external.refreshBalance, costs: { image_generate: 20 }, balance: 1000, checkBalance: () => true }) }));
vi.mock("@/hooks/useTeacherErrorMessage", () => ({ useTeacherErrorMessage: () => external.errorMessage }));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ user: { userId: "owner-a" }, bootstrapComplete: true }) }));
vi.mock("@/components/LatexRenderer", () => ({ LatexRenderer: () => null }));
vi.mock("@/components/TokenBalance", () => ({ TokenBalance: () => null }));
vi.mock("@/components/generations/ModuleGenerationHistory", () => ({ ModuleGenerationHistory: () => null }));
vi.mock("@/lib/api", async importOriginal => ({ ...await importOriginal<object>(), getGenerationJob: external.read, enqueueGenerationJob: external.enqueue }));

const accepted = { id: external.jobId, kind: "image.generate", status: "running", result: null } as GenerationJob;
let root: Root; let host: HTMLDivElement; let cache: QueryClient;
async function flush() { await act(async () => { await new Promise(resolve => setTimeout(resolve, 0)); }); }
async function changePrompt(value: string) {
  const textarea = host.querySelector("textarea")!;
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")!.set!.call(textarea, value);
    textarea.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: value }));
    textarea.dispatchEvent(new Event("change", { bubbles: true }));
  });
}
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  window.history.replaceState({}, "", `?job=${external.jobId}`);
  external.read.mockReset(); external.enqueue.mockReset(); external.replace.mockReset();
  cache = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  host = document.createElement("div"); document.body.append(host); root = createRoot(host);
});
afterEach(async () => { await act(async () => root.unmount()); cache.clear(); host.remove(); vi.unstubAllGlobals(); });

async function mount(status: number, cached = true) {
  if (cached) cache.setQueryData(["generation-job", external.jobId], accepted);
  external.read.mockRejectedValue({ status });
  await act(async () => root.render(createElement(QueryClientProvider, { client: cache }, createElement(Page))));
  await flush();
  // Exercise the real change and submit handlers even when native controls are locked.
  await changePrompt("A small revised prompt");
}

describe("accepted image operation survives status-read failures", () => {
  it.each([503, 401, 403, 404, 410])("keeps cached active work locked through HTTP %i without an execution spinner", async status => {
    await mount(status);
    expect(host.querySelector("[type=submit]")?.hasAttribute("disabled")).toBe(true);
    expect(host.querySelector(".animate-spin")).toBeNull();
    expect(host.textContent).toContain("провер");
    await act(async () => { host.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })); });
    expect(external.enqueue).not.toHaveBeenCalled();
  });
  it.each([503, 401, 403, 404, 410])("holds an accepted job before its first successful HTTP read (%i)", async status => {
    await mount(status, false);
    expect(host.querySelector("[type=submit]")?.hasAttribute("disabled")).toBe(true);
    expect(host.querySelector(".animate-spin")).toBeNull();
    await act(async () => { host.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })); });
    expect(external.enqueue).not.toHaveBeenCalled();
  });
  it("releases submission only after the server confirms a terminal job", async () => {
    await mount(503);
    await act(async () => cache.setQueryData(["generation-job", external.jobId], { ...accepted, status: "cancelled" }));
    await flush();
    await changePrompt("A small revised prompt");
    expect(host.querySelector("textarea")?.value).toBe("A small revised prompt");
    expect(host.querySelector("[type=submit]")?.hasAttribute("disabled")).toBe(false);
    external.enqueue.mockResolvedValue({ ...accepted, id: "40bdc3b2-41e6-4399-877c-cbab8e93a5d9", status: "queued" });
    await act(async () => { host.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })); });
    expect(external.enqueue).toHaveBeenCalledWith("image.generate", { prompt: "A small revised prompt" }, { title: "A small revised prompt" });
  });
});


const consumers = [
  ["exam", () => import("@/app/dashboard/ai/bjb-tjb/page")],
  ["comics", () => import("@/app/dashboard/ai/comics/page")],
  ["infographics", () => import("@/app/dashboard/ai/infographics/page")],
  ["kornekilik", () => import("@/app/dashboard/ai/kornekilik/page")],
  ["worksheets", () => import("@/app/dashboard/ai/worksheets/page")],
  ["tests", () => import("@/app/dashboard/ai/tests/page")],
  ["voiceover", () => import("@/app/dashboard/media/voiceover/page")],
  ["race generator", () => import("@/app/dashboard/library/games/at-zharys/page")],
  ["essay", () => import("@/app/dashboard/ai-docs/page")],
  ["article", () => import("@/app/dashboard/ai/article/page")],
  ["class hours", () => import("@/app/dashboard/ai/class-hours/page")],
] as const;

it.each(consumers)("keeps the actual %s form locked when its accepted read fails", async (_label, load) => {
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Unexpected test network access")));
  const Consumer = (await load()).default;
  cache.setQueryData(["generation-job", external.jobId], accepted);
  external.read.mockRejectedValue({ status: 503 });
  await act(async () => root.render(createElement(QueryClientProvider, { client: cache }, createElement(Consumer))));
  await flush();
  const submit = host.querySelector<HTMLButtonElement>("button[type=submit]");
  expect(submit, "the real form renders a submit button").not.toBeNull();
  expect(submit?.disabled).toBe(true);
  expect(host.querySelector(".animate-spin")).toBeNull();
  expect(external.enqueue).not.toHaveBeenCalled();
  vi.unstubAllGlobals();
});


it.each([
  ["parent meeting", "parent-meeting-job", "parent_meeting.generate", () => import("@/features/parent-meetings/MeetingWorkspace")],
  ["preschool project", "preschool-project-job", "preschool_project.generate", () => import("@/features/preschool-projects/ProjectWorkspace")],
] as const)("keeps %s submission/reset locked without a perpetual sending label", async (_name, queryPrefix, kind, load) => {
  const Consumer = (await load()).default;
  cache.setQueryData([queryPrefix, "owner-a", external.jobId], { ...accepted, kind });
  external.read.mockRejectedValue({ status: 503 });
  await act(async () => root.render(createElement(QueryClientProvider, { client: cache }, createElement(Consumer))));
  await flush();
  expect(host.querySelector<HTMLButtonElement>("button[type=submit]")?.disabled).toBe(true);
  expect(host.textContent).not.toContain("Отправляем…");
  const reset = [...host.querySelectorAll<HTMLButtonElement>("button")].find(button => /Новое собрание|Новый проект/.test(button.textContent ?? ""));
  if (reset) { expect(reset.disabled).toBe(true); await act(async () => reset.click()); }
  await act(async () => { host.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })); });
  expect(external.enqueue).not.toHaveBeenCalled();
  expect(external.replace).not.toHaveBeenCalled();
});

it("keeps an untouched kornekilik form editable before any operation has been accepted", async () => {
  const previousId = external.jobId; external.jobId = "";
  try {
    const Consumer = (await import("@/app/dashboard/ai/kornekilik/page")).default;
    await act(async () => root.render(createElement(QueryClientProvider, { client: cache }, createElement(Consumer))));
    await flush();
    expect(host.querySelector<HTMLTextAreaElement>("textarea")?.disabled).toBe(false);
  } finally { external.jobId = previousId; }
});
