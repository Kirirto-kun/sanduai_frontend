import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("./api", () => ({ fetchLibraryPreviewBlob: vi.fn() }));

import { ContentPreview } from "./components/ContentPreview";

const previewSource = readFileSync(
  new URL("./components/ContentPreview.tsx", import.meta.url),
  "utf8",
);

describe("ContentPreview rendering", () => {
  it("shows a localized loading preview while the protected image is fetched", () => {
    const html = renderToStaticMarkup(createElement(ContentPreview, {
      src: "/api/library/previews/f1982b1e-acde-4f34-9e30-60c96352c8f1",
      alt: "Сабақ материалы",
      materialType: "visual_aid",
      previewStatus: "ready",
      language: "kk",
    }));

    expect(html).toContain('role="status"');
    expect(html).toContain('aria-label="Превью жүктелуде"');
    expect(html).not.toContain("Көрнекіліктер");
  });

  it("shows a localized fallback when an item has no preview", () => {
    const html = renderToStaticMarkup(createElement(ContentPreview, {
      alt: "Материал урока",
      materialType: "visual_aid",
      previewStatus: "failed",
      language: "ru",
    }));

    expect(html).toContain("Наглядные материалы");
    expect(html).not.toContain('role="status"');
  });

  it("renders the authenticated blob URL and releases it when the card changes or unmounts", () => {
    expect(previewSource).toContain("fetchLibraryPreviewBlob(src, controller.signal)");
    expect(previewSource).toContain("objectUrl = URL.createObjectURL(blob)");
    expect(previewSource).toContain("URL.revokeObjectURL(objectUrl)");
    expect(previewSource).toContain("src={resolvedSource}");
    expect(previewSource).toContain('role="status"');
    expect(previewSource).not.toContain("resolveLibraryUrl(src)");
  });
});
