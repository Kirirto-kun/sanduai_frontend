// @vitest-environment happy-dom
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import OutlinePage from "@/app/dashboard/ai/presentations/outline/[id]/page";
import CreatePage from "@/app/dashboard/ai/presentations/create/page";
import EditorPage from "@/app/dashboard/ai/presentations/editor/[id]/page";
import GenerationProgress from "./GenerationOverlay";
import ExportDialog from "./editor/ExportDialog";
import { ConfirmDialog, ProjectStatusBadge } from "./PresentationUI";
import type { PresentationProject } from "@/types/presentations";

const state = vi.hoisted(() => ({
  language: "ru" as "ru" | "kk", replace: vi.fn(), push: vi.fn(),
  projectId: "182a6bdf-54c6-41c4-9fa2-fb98259441e7", jobId: "30bdc3b2-41e6-4399-877c-cbab8e93a5d9",
  jobInUrl: true,
}));
vi.mock("@/i18n/LanguageContext", () => ({ useLanguage: () => ({ language: state.language }) }));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ user: { userId: "teacher-a" }, loading: false }) }));
vi.mock("next/navigation", () => ({ useParams: () => ({ id: state.projectId }), useRouter: () => ({ replace: state.replace, push: state.push }), useSearchParams: () => new URLSearchParams(state.jobInUrl ? `job=${state.jobId}` : "") }));

let root: Root;
let host: HTMLDivElement;
let cache: QueryClient;
let jobStatus: string;
let exportState: string;
let posts: string[];
let projectReadError: boolean;
let jobReadError: boolean;
let currentProject: PresentationProject;
let creativeState: string;
let jobErrorCode: string | undefined;
const project: PresentationProject = {
  id: state.projectId, title: "Сохранённая презентация", language: "ru", mode: "creative", status: "planning",
  created_at: "2026-11-12T00:00:00Z", read_only: false, source_missing: false, legacy_presenton_id: null, artifacts: [],
  active_plan_job_id: state.jobId,
};
async function advance(ms = 0) { await act(async () => { await vi.advanceTimersByTimeAsync(ms); }); }
async function mount(component: ReturnType<typeof createElement>) {
  await act(async () => root.render(createElement(QueryClientProvider, { client: cache }, component)));
  // Dependent project/job reads notify React observers in a later timer turn.
  await advance(1);
}
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true }); vi.useFakeTimers();
  state.language = "ru"; state.replace.mockReset(); state.push.mockReset();
  state.jobInUrl = true; jobErrorCode = undefined;
  jobStatus = "queued"; exportState = "available"; posts = [];
  projectReadError = false; jobReadError = false; currentProject = project; creativeState = "unavailable";
  cache = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity } } });
  host = document.createElement("div"); document.body.append(host); root = createRoot(host);
  vi.stubGlobal("fetch", vi.fn(async (url, init: RequestInit) => {
    const path = new URL(String(url)).pathname;
    if (projectReadError && path === `/api/v2/presentations/${project.id}`) return new Response("{}", { status: 503 });
    if (jobReadError && path === `/api/v2/jobs/${state.jobId}`) return new Response("{}", { status: 503 });
    if (init.method && init.method !== "GET") {
      posts.push(path);
      return new Response(JSON.stringify({ job_id: state.jobId, kind: "plan", status: "queued" }), { status: 202 });
    }
    const payload = path.endsWith("capabilities") ? {
      creative: { available: false }, classic: { available: true },
      operations: { presentation_plan: "available", creative_slides: creativeState, classic_render: "available", presentation_export: exportState },
      planner: { remote_available: false, fallback_available: true },
    } : path.endsWith("exports") ? { items: [{ id: "saved-export", format: "pptx", status: "completed", filename: "Saved slides.pptx" }] }
      : path.endsWith("events") ? null
        : path.includes("/jobs/") ? { id: state.jobId, job_id: state.jobId, kind: "plan", project_id: state.projectId, status: jobStatus, error_code: jobErrorCode }
          : currentProject;
    return new Response(JSON.stringify(payload), { status: payload === null ? 503 : 200, headers: { "Content-Type": "application/json" } });
  }));
});
afterEach(async () => { await act(async () => root.unmount()); cache.clear(); host.remove(); vi.useRealTimers(); vi.unstubAllGlobals(); });

describe("presentation workspace recovery", () => {
  it("does not restart a failed plan on browser refresh", async () => {
    jobStatus = "failed"; await mount(createElement(OutlinePage)); await advance(1000);
    expect(posts).toEqual([]);
    expect(host.querySelector(".animate-spin")).toBeNull();
  });

  it("recovers the stored plan job after refresh even without a URL job parameter", async () => {
    state.jobInUrl = false; jobStatus = "running";
    await mount(createElement(OutlinePage));
    expect(cache.getQueryData(["presentations-v2", "job", state.jobId])).toMatchObject({ id: state.jobId, status: "running" });
    await act(async () => root.unmount()); cache.clear();
    cache = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity } } }); root = createRoot(host);
    jobStatus = "completed";
    await mount(createElement(OutlinePage));
    expect(cache.getQueryData(["presentations-v2", "job", state.jobId])).toMatchObject({ id: state.jobId, status: "completed" });
    expect(posts).toEqual([]);
    expect(host.querySelector(".animate-spin")).toBeNull();
  });

  it("explains an expired plan queue reported as failed", async () => {
    jobStatus = "failed"; jobErrorCode = "PRESENTATION_QUEUE_EXPIRED";
    await mount(createElement(OutlinePage));
    expect(host.textContent).toContain("Истекло время ожидания");
    expect(posts).toEqual([]);
  });

  it.each(["ru", "kk"] as const)("distinguishes queued and running plan states in %s", async language => {
    state.language = language; await mount(createElement(OutlinePage));
    expect(host.textContent).toContain(language === "kk" ? "Кезекте" : "В очереди");
    jobStatus = "running"; await advance(2000);
    expect(cache.getQueryData(["presentations-v2", "job", state.jobId])).toMatchObject({ status: "running" });
    await advance(1);
    expect(host.textContent).toContain(language === "kk" ? "Орындалуда" : "Выполняется");
    expect(posts).toEqual([]);
  });

  it.each(["completed", "completed_with_errors", "partial_failed", "expired", "queue_expired"])("does not spin forever when a %s plan has no published snapshot", async terminal => {
    jobStatus = terminal; await mount(createElement(OutlinePage));
    expect(host.querySelector(".animate-spin")).toBeNull();
    expect(host.textContent).toContain("Обновить статус");
    expect(posts).toEqual([]);
  });

  it.each(["classic", "creative"] as const)("keeps %s export and ready downloads usable during creative unavailability", async mode => {
    await mount(createElement(ExportDialog, { presentationId: project.id, mode, open: true, onClose() {} }));
    const buttons = [...host.querySelectorAll("button")];
    expect(buttons.find(button => button.textContent === "Подготовить файл")?.disabled).toBe(false);
    expect(buttons.find(button => button.textContent === "Скачать")?.disabled).toBe(false);
    expect(host.textContent).toContain("Saved slides.pptx");
    expect(posts).toEqual([]);
  });

  it("blocks only new export preparation during an export outage and preserves downloads", async () => {
    exportState = "unavailable";
    await mount(createElement(ExportDialog, { presentationId: project.id, mode: "classic", open: true, onClose() {} }));
    const buttons = [...host.querySelectorAll("button")];
    expect(buttons.find(button => button.textContent === "Подготовить файл")?.disabled).toBe(true);
    expect(buttons.find(button => button.textContent === "Скачать")?.disabled).toBe(false);
    expect(host.textContent).toContain("временно недоступно");
  });

  it("explains creative unavailability before accepting a new creation", async () => {
    await mount(createElement(CreatePage));
    expect(host.querySelector<HTMLButtonElement>("button[type=submit]")?.disabled).toBe(true);
    expect(host.textContent).toContain("временно недоступно");
    expect(posts).toEqual([]);
  });

  it("shows a cooldown distinctly from unavailable creation", async () => {
    creativeState = "cooldown"; await mount(createElement(CreatePage));
    expect(host.querySelector<HTMLButtonElement>("button[type=submit]")?.disabled).toBe(true);
    expect(host.textContent).toContain("временно приостановлено");
  });

  it.each([true, false])("labels a simplified plan only when its saved recovered flag is %s", async recovered => {
    jobStatus = "completed";
    currentProject = {
      ...project, status: "plan_ready", active_plan: {
        id: "saved-plan", revision: 1, title: "Сохранённый план", recovered,
        slides: [1, 2, 3, 4].map(order => ({ slide_key: `slide-${order}`, order, title: `Слайд ${order}` })),
      },
    };
    await mount(createElement(OutlinePage));
    expect(host.textContent?.includes("План восстановлен в упрощённом виде")).toBe(recovered);
  });

  it("preserves cached finished slides when refreshing the project returns 503", async () => {
    jobStatus = "completed"; projectReadError = true;
    const finished: PresentationProject = {
      ...project, mode: "classic", status: "ready", active_plan_job_id: null,
      slides: [{ slide_key: "slide-1", order: 1, title: "Сохранённый слайд", status: "ready", spec: { title: "Сохранённый слайд", body: "Готовый материал" } }],
      latest_job: { id: state.jobId, kind: "generate", status: "completed" },
    };
    cache.setQueryData(["presentations-v2", "detail", project.id], finished);
    await mount(createElement(EditorPage));
    expect(host.textContent).toContain("Сохранённый слайд");
    expect(host.textContent).toContain("Обновить статус");
    expect(posts).toEqual([]);
  });

  it("blocks creative regeneration while keeping completed slides and export controls", async () => {
    jobStatus = "completed";
    currentProject = {
      ...project, status: "ready", active_plan_job_id: null,
      slides: [{ slide_key: "slide-1", order: 1, title: "Сохранённый слайд", status: "ready", spec: { title: "Сохранённый слайд" } }],
      latest_job: { id: state.jobId, kind: "generate", status: "completed" },
    };
    await mount(createElement(EditorPage));
    const buttons = [...host.querySelectorAll("button")];
    expect(buttons.find(button => button.textContent === "Создать другой вариант")?.disabled).toBe(true);
    expect(buttons.find(button => button.textContent === "Экспорт")?.disabled).toBe(false);
    expect(host.textContent).toContain("Сохранённый слайд");
    expect(posts).toEqual([]);
  });

  it.each(["disconnected", "expired"])("removes the unfinished slide spinner when the job is %s", async condition => {
    jobStatus = condition === "expired" ? "expired" : "running";
    jobReadError = condition === "disconnected";
    currentProject = {
      ...project, status: "generating", active_plan_job_id: null,
      slides: [{ slide_key: "slide-1", order: 1, title: "Сохранённый слайд", status: "queued" }],
      latest_job: { id: state.jobId, kind: "generate", status: "running" },
    };
    await mount(createElement(EditorPage));
    expect(host.querySelector(".animate-spin")).toBeNull();
    expect(posts).toEqual([]);
  });
});

describe("presentation terminal status display", () => {
  it.each(["partial_failed", "expired", "queue_expired", "cancelled"])("stops busy display and cancel action for %s", async status => {
    await mount(createElement(GenerationProgress, { job: { id: state.jobId, status }, completed: 2, total: 4, onCancel() {} }));
    expect(host.querySelector("[aria-busy=true]")).toBeNull();
    expect([...host.querySelectorAll("button")].some(button => button.textContent === "Остановить оставшиеся")).toBe(false);
    expect(host.textContent).toContain(status === "partial_failed" ? "Часть слайдов" : status === "cancelled" ? "Остановлено" : "Истекло время ожидания");
  });

  it("uses a queue badge instead of a generation badge", async () => {
    await mount(createElement(ProjectStatusBadge, { status: "queued" }));
    expect(host.textContent).toBe("В очереди");
  });

  it("allows closing confirmation when capacity disables only the paid action", async () => {
    const close = vi.fn();
    await mount(createElement(ConfirmDialog, {
      open: true, title: "Создание", body: "Подтвердите создание", confirmLabel: "Начать", cancelLabel: "Отмена",
      confirmDisabled: true, onConfirm() {}, onClose: close,
    }));
    const buttons = [...host.querySelectorAll("button")];
    expect(buttons.find(button => button.textContent === "Начать")?.disabled).toBe(true);
    expect(buttons.find(button => button.textContent === "Отмена")?.disabled).toBe(false);
    await act(async () => buttons.find(button => button.textContent === "Отмена")!.click());
    expect(close).toHaveBeenCalledTimes(1);
  });

  it("explains an expired queue reported as a failed job", async () => {
    await mount(createElement(GenerationProgress, { job: { id: state.jobId, status: "failed", error_code: "PRESENTATION_QUEUE_EXPIRED" }, completed: 0, total: 4 }));
    expect(host.textContent).toContain("Истекло время ожидания");
    expect(host.querySelector("[aria-busy=true]")).toBeNull();
  });
});
