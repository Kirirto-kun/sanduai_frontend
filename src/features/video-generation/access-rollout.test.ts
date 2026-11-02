import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  role: "teacher" as string | undefined,
  loading: false,
  language: "ru",
  workspace: vi.fn(),
  handoff: vi.fn(),
  masterclass: vi.fn(),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { userId: "rollout-user", role: state.role }, loading: state.loading }),
}));
vi.mock("@/i18n/LanguageContext", () => ({ useLanguage: () => ({ language: state.language }) }));
vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams("competitionWork=private-work") }));
vi.mock("@/features/pedagogical-competitions/api", () => ({ getVideoHandoff: state.handoff }));
vi.mock("@tanstack/react-query", () => ({ useQuery: () => { state.handoff(); return {}; } }));
vi.mock("@/features/masterclasses/useMasterclassHandoff", () => ({
  useMasterclassHandoff: () => { state.masterclass(); return {}; },
}));
vi.mock("@/features/masterclasses/MasterclassHandoffNotice", () => ({ MasterclassHandoffNotice: () => null }));
vi.mock("./VideoWorkspace", () => ({ VideoWorkspace: () => { state.workspace(); return "Admin video studio"; } }));

import VideoPage from "@/app/dashboard/media/video/page";

describe("administrator-only video rollout", () => {
  beforeEach(() => {
    state.role = "teacher";
    state.loading = false;
    state.language = "ru";
  });

  it.each(["teacher", "user", "super_admin", undefined])("does not mount video or handoff queries for %s", (role) => {
    state.role = role;
    const html = renderToStaticMarkup(createElement(VideoPage));
    expect(html).toContain("Генерация видео пока доступна только администратору");
    expect(html).toContain('href="/dashboard"');
    expect(state.workspace).not.toHaveBeenCalled();
    expect(state.handoff).not.toHaveBeenCalled();
    expect(state.masterclass).not.toHaveBeenCalled();
  });

  it("waits for session restoration without mounting studio requests", () => {
    state.loading = true;
    state.role = "admin";
    const html = renderToStaticMarkup(createElement(VideoPage));
    expect(html).toContain("Проверяем доступ");
    expect(state.workspace).not.toHaveBeenCalled();
    expect(state.handoff).not.toHaveBeenCalled();
  });

  it("explains the restriction in Kazakh", () => {
    state.language = "kk";
    expect(renderToStaticMarkup(createElement(VideoPage))).toContain("Видео генерациясы әзірге тек әкімшіге қолжетімді");
  });

  it("retains the complete studio and handoff flow for admin", () => {
    state.role = "admin";
    const html = renderToStaticMarkup(createElement(VideoPage));
    expect(html).toContain("Admin video studio");
    expect(state.workspace).toHaveBeenCalledOnce();
    expect(state.handoff).toHaveBeenCalledOnce();
    expect(state.masterclass).toHaveBeenCalledOnce();
  });
});
