import { afterEach, describe, expect, it, vi } from "vitest";

import { exportLessonPlanDocx, getGenerationJob, type GenerationJob } from "./api";
import { contentLanguageForGenerationJob, downloadGenerationMaterial } from "./generation-download";

vi.mock("./api", async (original) => ({
  ...await original<typeof import("./api")>(),
  getGenerationJob: vi.fn(),
  exportLessonPlanDocx: vi.fn(),
}));

afterEach(() => vi.unstubAllGlobals());


describe("generation download content language", () => {
  it("prefers the language recovered from the durable request", () => {
    expect(contentLanguageForGenerationJob({
      content_language: "ru",
      result: { language: "kk", title: "Сохранённый материал" },
    })).toBe("ru");
  });

  it("uses persisted result metadata for older response contracts", () => {
    expect(contentLanguageForGenerationJob({
      content_language: null,
      result: { settings: { language: "uz" } },
    })).toBe("uz");
  });

  it("does not substitute an unrelated interface language for unknown legacy output", () => {
    expect(contentLanguageForGenerationJob({
      content_language: null,
      result: { title: "Legacy output without language metadata" },
    })).toBeNull();
  });

  it("downloads a classic history result as Word through the existing authenticated exporter", async () => {
    const blob = new Blob(["docx"], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
    vi.mocked(getGenerationJob).mockResolvedValue({ id: "classic-job", title: "Классический план", kind: "kmzh.classic.generate", content_language: "ru", result: { planner_version: "legacy_v2", language: "russian", meta: {}, flow: [] }, artifact_urls: [] } as unknown as GenerationJob);
    vi.mocked(exportLessonPlanDocx).mockResolvedValue(blob);
    const link = { href: "", download: "", click: vi.fn(), remove: vi.fn() };
    vi.stubGlobal("document", { createElement: vi.fn(() => link), body: { appendChild: vi.fn() } });
    vi.stubGlobal("window", { setTimeout: vi.fn() });
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:classic-word");
    await downloadGenerationMaterial({ id: "classic-job", title: "Классический план" });
    expect(exportLessonPlanDocx).toHaveBeenCalledWith(expect.objectContaining({ planner_version: "legacy_v2", language: "russian" }));
    expect(link.download).toBe("Классический_план.docx");
    expect(link.click).toHaveBeenCalledOnce();
  });
});
