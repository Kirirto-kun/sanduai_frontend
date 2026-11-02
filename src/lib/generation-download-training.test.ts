import { afterEach, describe, expect, it, vi } from "vitest";
import * as api from "./api";
import { downloadGenerationMaterial } from "./generation-download";

const JOB_ID = "30bdc3b2-41e6-4399-877c-cbab8e93a5d9";

describe("training history download", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  function prepareDownload(kind = "training.generate") {
    const anchor = { href: "", download: "", click: vi.fn(), remove: vi.fn() };
    vi.stubGlobal("document", { createElement: vi.fn(() => anchor), body: { appendChild: vi.fn() } });
    vi.stubGlobal("window", { setTimeout: vi.fn() });
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:training-export");
    vi.spyOn(api, "getToken").mockReturnValue("test-access-token");
    vi.spyOn(api, "getGenerationJob").mockResolvedValue({
      id: JOB_ID,
      kind,
      title: "Тренинг: ынтымақтастық",
      content_language: "kk",
      result: { language: "kk", title: "Тренинг" },
      artifact_urls: [],
    } as unknown as api.GenerationJob);
    return anchor;
  }

  it("downloads the owned server document through the authenticated export endpoint", async () => {
    const anchor = prepareDownload();
    const fetch = vi.fn().mockResolvedValue(new Response(new Blob(["docx-document"])));
    vi.stubGlobal("fetch", fetch);

    await downloadGenerationMaterial({ id: JOB_ID, title: "Тренинг" });

    expect(fetch).toHaveBeenCalledWith(expect.stringContaining(`/api/v1/trainings/${JOB_ID}/export?format=docx`), expect.objectContaining({
      credentials: "include",
      headers: { Authorization: "Bearer test-access-token" },
    }));
    expect(anchor.download).toBe("Тренинг-_ынтымақтастық.docx");
    expect(anchor.click).toHaveBeenCalledOnce();
  });

  it("preserves export failures instead of downloading an error response", async () => {
    const anchor = prepareDownload();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ detail: "Not found" }), { status: 404, headers: { "Content-Type": "application/json" } })));

    await expect(downloadGenerationMaterial({ id: JOB_ID, title: "Тренинг" })).rejects.toMatchObject({ status: 404 });
    expect(anchor.click).not.toHaveBeenCalled();
  });

  it("downloads preschool projects through their owned Word endpoint", async () => {
    const anchor = prepareDownload("preschool_project.generate");
    const fetch = vi.fn().mockResolvedValue(new Response(new Blob(["preschool-docx"])));
    vi.stubGlobal("fetch", fetch);
    await downloadGenerationMaterial({ id: JOB_ID, title: "Жоба" });
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining(`/api/v1/preschool-projects/${JOB_ID}/export?format=docx`), expect.objectContaining({
      credentials: "include",
      headers: { Authorization: "Bearer test-access-token" },
    }));
    expect(anchor.download).toMatch(/\.docx$/);
    expect(anchor.click).toHaveBeenCalledOnce();
  });
});
