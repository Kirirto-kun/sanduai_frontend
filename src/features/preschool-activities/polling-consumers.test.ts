// @vitest-environment happy-dom
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import Workspace from "./PreschoolActivityWorkspace";
import { defaultPreschoolInput } from "./model";
import { savePreschoolPending } from "./recovery";
import type { PreschoolActivityDocument, PreschoolConfig } from "./types";
const calls = vi.hoisted(() => ({ config: vi.fn(), job: vi.fn(), get: vi.fn(), generate: vi.fn(), transformTask: vi.fn(), replace: vi.fn(), refreshBalance: vi.fn(), params: "" }));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ user: { userId: "preschool-lock-test" } }) }));
vi.mock("@/i18n/LanguageContext", () => ({ useLanguage: () => ({ language: "ru" }) }));
vi.mock("@/hooks/useTokens", () => ({ useTokens: () => ({ balance: 1000, refreshBalance: calls.refreshBalance }) }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: calls.replace }), useSearchParams: () => new URLSearchParams(calls.params) }));
vi.mock("./api", () => ({ preschoolActivityApi: { config: calls.config, job: calls.job, get: calls.get, generate: calls.generate, transformTask: calls.transformTask } }));
const config: PreschoolConfig = {
  standard_version: "2026.1", regulatory_note: "", regulatory_notes: {}, main_objectives: [], program_requirements: [],
  age_groups: [{ id: "middle", label: { ru: "Средняя" }, age: 3 }], activity_areas: [{ id: "speech", label: { ru: "Речь" }, min_age: 2, max_age: 7 }],
  styles: [{ id: "mixed", label: { ru: "Смешанный" } }], support_needs: [], languages: [{ code: "ru", label: "Русский" }], duration_options: [20], token_cost: 20, task_token_cost: 3, topic_token_cost: 1, teacher_name: "Teacher",
};
const savedDocument: PreschoolActivityDocument = {
  ...defaultPreschoolInput(config, "ru"), id: "activity-a", topic: "Saved activity", standard_version: "2026.1", token_cost: 20, version: 1, created_at: "2026-11-10T00:00:00Z", updated_at: "2026-11-10T00:00:00Z",
  content: { title: "Saved activity", goal: "Explore", objectives: [], expected_results: [], resources: [], preliminary_work: [], story_arc: "", group_division_method: "", safety_rules: [], total_duration_minutes: 20, phases: [
    { id: "phase-a", kind: "main", title: "Play", duration_minutes: 20, teacher_script: [], children_actions: [], expected_answers: [], tasks: [
      { id: "task-a", title: "Saved task", purpose: "Explore", materials: [], teacher_action: "Show", children_action: "Try", steps: [], result: "Saved result" },
    ] },
  ] },
};
let root: Root; let host: HTMLDivElement;
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true }); localStorage.clear(); calls.params = "";
  calls.job.mockRejectedValue({ status: 503 }); calls.config.mockResolvedValue(config); calls.get.mockResolvedValue(savedDocument); calls.generate.mockReset(); calls.transformTask.mockReset();
  host = document.createElement("div"); document.body.append(host); root = createRoot(host);
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); savePreschoolPending("preschool-lock-test", null); });
async function mount() { await act(async () => root.render(createElement(Workspace))); await act(async () => { await new Promise(resolve => setTimeout(resolve, 0)); }); }
it("keeps the recovered generation locked while suppressing its submit spinner during a read outage", async () => {
  savePreschoolPending("preschool-lock-test", { id: "30bdc3b2-41e6-4399-877c-cbab8e93a5d9", kind: "generate" });
  await mount();
  expect(host.querySelector<HTMLButtonElement>("button[type=submit]")?.disabled).toBe(true);
  expect(host.querySelector(".animate-spin")).toBeNull();
  expect(calls.generate).not.toHaveBeenCalled();
});
it("preserves a task's content and mutation lock without its stale pending animation", async () => {
  calls.params = "document=activity-a"; await mount();
  const action = [...host.querySelectorAll<HTMLButtonElement>("button")].find(button => button.textContent?.includes("Применить"))!;
  expect(action).toBeDefined();
  calls.transformTask.mockResolvedValue({ id: "task-job-a", status: "queued", progress: {} });
  await act(async () => action.click());
  await act(async () => { await new Promise(resolve => setTimeout(resolve, 0)); });
  expect(host.textContent).toContain("Saved task");
  expect(action.disabled).toBe(true);
  expect(host.querySelector(".animate-spin")).toBeNull();
  await act(async () => action.click()); expect(calls.transformTask).toHaveBeenCalledTimes(1);
});
