import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ScienceWorkspace from "./ScienceWorkspace";
import { blankRequest } from "./model";
import type { ConsultationSeed } from "./types";

const state = vi.hoisted(() => ({ id: "30bdc3b2-41e6-4399-877c-cbab8e93a5d9", query: { isPending: true, data: undefined as unknown, error: null as unknown, refetch: vi.fn() }, options: vi.fn() }));
vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams({ job: state.id }), useRouter: () => ({ replace: vi.fn() }) }));
vi.mock("@tanstack/react-query", () => ({ useQuery: (options: unknown) => { state.options(options); return state.query; } }));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ user: { userId: "owner" } }) }));
vi.mock("@/i18n/LanguageContext", () => ({ useLanguage: () => ({ language: "ru" }) }));
vi.mock("./ScienceResult", () => ({ default: ({ request, result }: ConsultationSeed) => createElement("div", { "data-original-request": request.title }, result.title) }));
vi.mock("./ScienceConsultation", () => ({ default: ({ initialJobId }: { initialJobId: string }) => createElement("div", { "data-poll-job": initialJobId }) }));
vi.mock("./ScienceUsage", () => ({ default: () => null }));
vi.mock("./ScienceMaterials", () => ({ default: () => null }));
beforeEach(() => { state.id = "30bdc3b2-41e6-4399-877c-cbab8e93a5d9"; state.query = { isPending: true, data: undefined, error: null, refetch: vi.fn() }; state.options.mockClear(); });

describe("Science history URL boundary", () => {
  it("loads exactly the selected owner-scoped job before displaying a workspace", () => {
    expect(renderToStaticMarkup(createElement(ScienceWorkspace))).toContain("Открываем исходный запрос");
    expect(state.options).toHaveBeenCalledWith(expect.objectContaining({ queryKey: ["science-linked-consultation", "owner", state.id], enabled: true, retry: false }));
  });
  it("shows the historical request/result and resumes only that job's polling", () => {
    state.query = { ...state.query, isPending: false, data: { request: { ...blankRequest("ru"), title: "Original selected research" }, result: { mode: "idea", title: "Original selected advice", ai_generated: true }, jobId: state.id, projectId: "project", documents: [] } };
    const html = renderToStaticMarkup(createElement(ScienceWorkspace));
    expect(html).toContain('data-original-request="Original selected research"'); expect(html).toContain("Original selected advice"); expect(html).toContain(`data-poll-job="${state.id}"`); expect(html).toContain("Текущий проект не изменён");
  });
  it("shows a safe error for a foreign/expired or malformed link without falling back to a form", () => {
    state.query = { ...state.query, isPending: false, error: { status: 410 } };
    const denied = renderToStaticMarkup(createElement(ScienceWorkspace)); expect(denied).toContain('role="alert"'); expect(denied).not.toContain('id="science-title"');
    state.id = "not-a-job-id";
    expect(renderToStaticMarkup(createElement(ScienceWorkspace))).toContain("Некорректная ссылка");
    expect(state.options).toHaveBeenLastCalledWith(expect.objectContaining({ enabled: false }));
  });
});
