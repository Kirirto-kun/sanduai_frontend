import { describe, expect, it } from "vitest";

import {
  MAX_SOURCE_PAGE_BYTES,
  buildWorksheetStyleDescription,
  isWorksheetImageResult,
  safeWorksheetFileName,
  validateSourcePages,
  validateWorksheetImageForm,
} from "./worksheet-image";


describe("worksheet image validation", () => {
  it("accepts up to three supported source pages", () => {
    expect(validateSourcePages([
      { name: "1.jpg", type: "image/jpeg", size: 100 },
      { name: "2.png", type: "image/png", size: 200 },
      { name: "3.webp", type: "image/webp", size: 300 },
    ])).toBeNull();
  });

  it("rejects too many, unsupported, and oversized pages", () => {
    const valid = { name: "page.jpg", type: "image/jpeg", size: 100 };
    expect(validateSourcePages([valid, valid, valid, valid])).toBe("too_many");
    expect(validateSourcePages([{ name: "book.pdf", type: "application/pdf", size: 100 }]))
      .toBe("unsupported_type");
    expect(validateSourcePages([{
      name: "large.png",
      type: "image/png",
      size: MAX_SOURCE_PAGE_BYTES + 1,
    }])).toBe("too_large");
  });

  it("requires a subject, learning source, and at least one task type", () => {
    expect(validateWorksheetImageForm({
      subject: " ",
      topic: "Fractions",
      content: "",
      sourcePageCount: 0,
      taskTypes: ["multiple_choice"],
    })).toBe("subject_required");
    expect(validateWorksheetImageForm({
      subject: "Mathematics",
      topic: "",
      content: "",
      sourcePageCount: 0,
      taskTypes: ["multiple_choice"],
    })).toBe("learning_source_required");
    expect(validateWorksheetImageForm({
      subject: "Mathematics",
      topic: "",
      content: "",
      sourcePageCount: 1,
      taskTypes: [],
    })).toBe("task_type_required");
    expect(validateWorksheetImageForm({
      subject: "Mathematics",
      topic: "",
      content: "",
      sourcePageCount: 1,
      taskTypes: ["open_question"],
    })).toBeNull();
  });
});


describe("worksheet image helpers", () => {
  it("combines a preset with optional teacher style notes", () => {
    expect(buildWorksheetStyleDescription("bright", "  add space theme  "))
      .toContain("Teacher preference: add space theme");
    expect(buildWorksheetStyleDescription("print", "")).toContain("Black-and-white");
  });

  it("guards the durable worksheet image result", () => {
    expect(isWorksheetImageResult({
      title: "Fractions",
      image_url: "https://cdn.example/worksheet.png",
      answer_key: ["1. A"],
      cost_tokens: 10,
    })).toBe(true);
    expect(isWorksheetImageResult({ title: "Fractions", image_url: "" })).toBe(false);
  });

  it("creates a safe download name", () => {
    expect(safeWorksheetFileName("  Fractions: 1 / 2  ")).toBe("Fractions-_1_-_2");
  });
});
