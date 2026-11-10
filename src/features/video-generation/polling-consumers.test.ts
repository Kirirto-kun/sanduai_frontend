// @vitest-environment happy-dom
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { QueryClient, QueryClientProvider, QueryObserver } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { VideoWorkspace } from "./VideoWorkspace";
import { createVideoIntent, readVideoIntent } from "./recovery";
import { DEFAULT_VIDEO_SETTINGS } from "./model";
import type { VideoCatalog, VideoProject } from "./types";

const network = vi.hoisted(() => ({ project: vi.fn(), generate: vi.fn(), export: vi.fn(), catalog: vi.fn(), library: vi.fn() }));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ user: { userId: "owner-a" } }) }));
vi.mock("@/i18n/LanguageContext", () => ({ useLanguage: () => ({ language: "ru" }) }));
vi.mock("./api", () => ({ videoApi: { project: network.project, generate: network.generate, export: network.export, catalog: network.catalog, projectPage: network.library } }));
vi.mock("./useSceneDraft", () => ({ useSceneDraft: (scene: object) => ({ draft: scene, state: "saved", update: () => {}, save: async () => scene, saveMyDraft: async () => {}, adopt: () => {}, saveError: null }) }));
vi.mock("./PrivateMedia", () => ({
  PrivateMedia: ({ assetId }: { assetId: string }) => createElement("div", { "data-media-asset": assetId }, "Saved media"),
  DownloadVideo: () => createElement("span", null, "Download saved media"), useMediaExpired: () => false,
}));
const settings = { ...DEFAULT_VIDEO_SETTINGS, model_id: "test-model" };
const project: VideoProject = {
  id: "project-a", title: "Saved project", idea: "A short film", script: "", language: "ru", aspect_ratio: "16:9", characters: "", audio_notes: "", visual_style: "", defaults: settings,
  created_at: "2026-11-10T00:00:00Z", updated_at: "2026-11-10T00:00:00Z", expires_at: "2099-11-12T00:00:00Z",
  scenes: [{ id: "scene-a", project_id: "project-a", title: "Saved scene", prompt: "A clear scene prompt", settings, position: 0, included: true, selected_version_id: "ready-version", versions: [
    { id: "ready-version", status: "completed", asset_id: "saved-asset", settings, created_at: "2026-11-10T00:00:00Z" },
    { id: "pending-version", status: "running", settings, created_at: "2026-11-10T01:00:00Z" },
  ] }], jobs: [{ id: "video-job-a", project_id: "project-a", scene_id: "scene-a", status: "running" }],
  exports: [{ id: "export-a", status: "running", resolution: "720p", created_at: "2026-11-10T00:00:00Z" }],
};
const catalog: VideoCatalog = { models: [{ id: "test-model", label: "Test model", provider: "test", available: true, resolutions: ["720p"], aspect_ratios: ["16:9"], min_duration: 5, max_duration: 5 }], max_scenes: 10, max_project_duration: 60, max_concurrent_jobs: 2, max_image_mb: 10 };
let root: Root; let host: HTMLDivElement; let cache: QueryClient; let observer: QueryObserver<VideoProject>; let unsubscribe: () => void;
async function advance(ms = 0) { await act(async () => { await vi.advanceTimersByTimeAsync(ms); }); }
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true }); vi.useFakeTimers(); localStorage.clear();
  network.project.mockReset(); network.generate.mockReset(); network.export.mockReset();
  network.catalog.mockResolvedValue(catalog); network.library.mockResolvedValue({ items: [], total: 0 });
  cache = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  cache.setQueryData(["video-catalog", "owner-a"], catalog);
  cache.setQueryData(["video-project", "owner-a", project.id], project);
  createVideoIntent("owner-a", project.id, "scene-a", "unresolved-quote");
  host = document.createElement("div"); document.body.append(host); root = createRoot(host);
});
afterEach(async () => { unsubscribe?.(); await act(async () => root.unmount()); cache.clear(); host.remove(); vi.useRealTimers(); });
async function mount(status: number) {
  network.project.mockRejectedValue({ status });
  await act(async () => root.render(createElement(QueryClientProvider, { client: cache }, createElement(VideoWorkspace, { requestedProject: project.id }))));
  await advance();
  // A real observer reports the same cached result/error used by the consumer tree.
  observer = new QueryObserver<VideoProject>(cache, { queryKey: ["video-project", "owner-a", project.id], enabled: false });
  unsubscribe = observer.subscribe(() => {});
}

describe("video intent reconciliation respects the status connection", () => {
  it.each([401, 403, 404, 410])("makes no timer reads after HTTP %i while retaining intent, media and submission locks", async status => {
    await mount(status);
    expect(observer.getCurrentResult().data).toEqual(project);
    expect(network.project).toHaveBeenCalledTimes(1);
    await advance(60000);
    expect(network.project).toHaveBeenCalledTimes(1);
    expect(readVideoIntent("owner-a", "scene-a")?.quoteId).toBe("unresolved-quote");
    expect(host.querySelector("[data-media-asset=saved-asset]")).not.toBeNull();
    expect(host.querySelector(".animate-spin")).toBeNull();
    expect(host.textContent).toContain("Последний известный");
    const replay = [...host.querySelectorAll<HTMLButtonElement>("button")].find(button => button.textContent?.includes("Восстановить запрос"))!;
    expect(replay.disabled).toBe(true);
    await act(async () => replay.click());
    expect(network.generate).not.toHaveBeenCalled();
  });
  it("follows 4/8/16/30-second backoff despite an unresolved scene intent", async () => {
    await mount(503); expect(network.project).toHaveBeenCalledTimes(1);
    await advance(4000); expect(network.project).toHaveBeenCalledTimes(2);
    await advance(7999); expect(network.project).toHaveBeenCalledTimes(2);
    await advance(1); expect(network.project).toHaveBeenCalledTimes(3);
    await advance(15999); expect(network.project).toHaveBeenCalledTimes(3);
    await advance(1); expect(network.project).toHaveBeenCalledTimes(4);
    await advance(29999); expect(network.project).toHaveBeenCalledTimes(4);
    await advance(1); expect(network.project).toHaveBeenCalledTimes(5);
    expect(network.generate).not.toHaveBeenCalled();
  });
  it("keeps cached export controls locked without processing spinners after a read error", async () => {
    await mount(403);
    const open = [...host.querySelectorAll("button")].find(button => button.textContent?.includes("Скачать ролик"))!;
    await act(async () => open.click());
    expect(document.querySelector("[role=dialog] .animate-spin")).toBeNull();
    const exportButton = [...document.querySelectorAll<HTMLButtonElement>("[role=dialog] button")].find(button => /MP4|Готовим ролик|Последний известный/.test(button.textContent ?? ""));
    expect(exportButton?.disabled).toBe(true);
    expect(network.export).not.toHaveBeenCalled();
  });
});

it.each([401, 503])("resumes ordinary reads after an explicit HTTP %i status retry without replaying the intent", async status => {
  await mount(status);
  network.project.mockResolvedValue(project);
  const retry = [...host.querySelectorAll<HTMLButtonElement>("button")].find(button => button.textContent === "Проверить снова")!;
  await act(async () => retry.click()); await advance();
  expect(network.project).toHaveBeenCalledTimes(2);
  expect(observer.getCurrentResult().error).toBeNull();
  expect(readVideoIntent("owner-a", "scene-a")?.quoteId).toBe("unresolved-quote");
  expect(host.querySelector("[data-media-asset=saved-asset]")).not.toBeNull();
  expect(network.generate).not.toHaveBeenCalled();
  await advance(4000); expect(network.project).toHaveBeenCalledTimes(3);
});

it("recovers an unresolved intent even when no job has appeared in the cached project yet", async () => {
  cache.setQueryData(["video-project", "owner-a", project.id], { ...project, jobs: [], exports: [] });
  await mount(503);
  await advance(4000); expect(network.project).toHaveBeenCalledTimes(2);
  await advance(7999); expect(network.project).toHaveBeenCalledTimes(2);
  await advance(1); expect(network.project).toHaveBeenCalledTimes(3);
  expect(readVideoIntent("owner-a", "scene-a")?.quoteId).toBe("unresolved-quote");
  expect(network.generate).not.toHaveBeenCalled();
});
