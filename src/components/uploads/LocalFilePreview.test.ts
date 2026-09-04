import { describe, expect, it } from "vitest";

import { localFilePreviewKind } from "./LocalFilePreview";

describe("localFilePreviewKind", () => {
  it.each([
    ["photo.jpg", "image/jpeg", "image"],
    ["scan.webp", "", "image"],
    ["lesson.pdf", "application/pdf", "pdf"],
    ["slides.pptx", "application/octet-stream", "presentation"],
    ["plan.docx", "application/octet-stream", "document"],
    ["clip.mp4", "video/mp4", "video"],
    ["archive.zip", "application/zip", "file"],
  ] as const)("classifies %s", (name, type, expected) => {
    expect(localFilePreviewKind({ name, type })).toBe(expected);
  });
});
