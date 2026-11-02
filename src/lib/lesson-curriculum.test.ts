import { afterEach, describe, expect, it, vi } from "vitest";
import { searchLessonCurriculum } from "./api";

describe("lesson curriculum lookup", () => {
  afterEach(() => vi.unstubAllGlobals());
  it("encodes exact teacher filters on the reference endpoint and supplies a cancellable request", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ items: [], programs: [], total: 0, knowledge_version: "v1", coverage: {}, warnings: [] }), { status: 200, headers: { "Content-Type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);
    const controller = new AbortController();
    await searchLessonCurriculum({ subject: "Қазақ тілі", grade: "4", teaching_language: "kazakh", query: "4.1.1.1", limit: 30 }, controller.signal);
    const url = new URL(String(fetchMock.mock.calls[0][0]));
    expect(url.pathname).toBe("/api/kmzh/curriculum");
    expect(url.searchParams.get("subject")).toBe("Қазақ тілі");
    expect(url.searchParams.get("teaching_language")).toBe("kazakh");
    expect(url.searchParams.get("query")).toBe("4.1.1.1");
    expect(fetchMock.mock.calls[0][1].signal).toBeInstanceOf(AbortSignal);
  });
});
