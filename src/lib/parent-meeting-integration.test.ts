import { afterEach, describe, expect, it, vi } from "vitest";
import { SEGMENTS, resolveNavAccess } from "@/i18n/navigation";
import { classifyRouteAccess } from "./access-policy";
import { generationMaterialFilterFromKind, generationSourceHref } from "./generation-history";
import { downloadGenerationMaterial } from "./generation-download";
import * as api from "./api";

const JOB_ID = "30bdc3b2-41e6-4399-877c-cbab8e93a5d9";

describe("parent meeting access, history and retained document", () => {
  afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

  it("offers the constructor in each educational segment without a library subscription", () => {
    for (const segment of SEGMENTS) {
      const group = segment.groups.find(x => x.items.some(item => item.key === "parent-meetings"));
      expect(group, segment.key).toBeDefined();
      const item = group!.items.find(x => x.key === "parent-meetings")!;
      expect(item.href).toBe("/dashboard/ai/parent-meetings");
      expect(item.soon).not.toBe(true);
      expect(resolveNavAccess(item, group!)).toBe("authenticated");
      expect(classifyRouteAccess(item.href)).toBe("authenticated");
    }
  });

  it("filters and reopens the exact saved package", () => {
    expect(generationMaterialFilterFromKind("parent_meeting.generate")).toBe("parent-meetings");
    expect(generationMaterialFilterFromKind("parent_meeting.unknown")).toBe("all");
    expect(generationSourceHref({ id: JOB_ID, kind: "parent_meeting.generate", source_path: "/dashboard/ai/parent-meetings" })).toBe(`/dashboard/ai/parent-meetings?job=${JOB_ID}`);
  });

  function prepareDownload() {
    const anchor = { href: "", download: "", click: vi.fn(), remove: vi.fn() };
    vi.stubGlobal("document", { createElement: vi.fn(() => anchor), body: { appendChild: vi.fn() } });
    vi.stubGlobal("window", { setTimeout: vi.fn() });
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:parent-meeting-export");
    vi.spyOn(api, "getToken").mockReturnValue("test-access-token");
    vi.spyOn(api, "getGenerationJob").mockResolvedValue({
      id: JOB_ID, kind: "parent_meeting.generate", title: "Собрание", content_language: "kk",
      result: { language: "kk", title: "Ата-аналар жиналысы" }, artifact_urls: [],
    } as unknown as api.GenerationJob);
    return anchor;
  }

  it("downloads the owner's server Word file with authenticated no-store access", async () => {
    const anchor = prepareDownload();
    const fetch = vi.fn().mockResolvedValue(new Response(new Blob(["docx-document"])));
    vi.stubGlobal("fetch", fetch);
    await downloadGenerationMaterial({ id: JOB_ID, title: "Собрание" });
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining(`/api/v1/parent-meetings/${JOB_ID}/export?format=docx`), expect.objectContaining({ cache: "no-store", credentials: "include", headers: { Authorization: "Bearer test-access-token" } }));
    expect(anchor.download).toBe("Собрание.docx");
    expect(anchor.click).toHaveBeenCalledOnce();
  });

  it("does not save an error response as a Word document", async () => {
    const anchor = prepareDownload();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ detail: "Not found" }), { status: 404, headers: { "Content-Type": "application/json" } })));
    await expect(downloadGenerationMaterial({ id: JOB_ID, title: "Собрание" })).rejects.toMatchObject({ status: 404 });
    expect(anchor.click).not.toHaveBeenCalled();
  });
});
