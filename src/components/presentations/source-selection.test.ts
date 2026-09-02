import { describe, expect, it } from "vitest";
import type { SavedKmzhSource } from "@/types/presentations";
import {
  buildPresentationCreateInput,
  validatePresentationSource,
} from "./source-selection";

const savedKmzh: SavedKmzhSource = {
  id: "4be58520-e6e0-4330-a7de-6a62b72a0142",
  kind: "kmzh.generate",
  title: "Компьютер жады",
  status: "completed",
  created_at: "2026-08-20T10:00:00Z",
  completed_at: "2026-08-20T10:01:00Z",
  expires_at: "2026-09-04T10:01:00Z",
};

const common = {
  mode: "creative" as const,
  subject: "",
  grade: "",
  language: "kk" as const,
  slideCount: 10,
};

describe("presentation source selection", () => {
  it("keeps the original topic-first flow", () => {
    expect(buildPresentationCreateInput({
      ...common,
      source: "topic",
      topic: "  Компьютер жады  ",
      subject: " Информатика ",
      grade: " 7-сынып ",
      pastedTitle: "",
      pastedText: "",
    })).toMatchObject({
      topic: "Компьютер жады",
      subject: "Информатика",
      grade: "7-сынып",
      audience: "7-сынып",
      source_kind: "scratch",
      slide_count: 10,
    });
  });

  it("sends only the selected owned KMJ id as lesson-plan context", () => {
    const payload = buildPresentationCreateInput({
      ...common,
      source: "saved_kmzh",
      topic: "",
      pastedTitle: "",
      pastedText: "",
      selectedKmzh: savedKmzh,
    });

    expect(payload).toMatchObject({
      title: savedKmzh.title,
      topic: savedKmzh.title,
      source_kind: "lesson_plan",
      source_generation_job_id: savedKmzh.id,
    });
    expect(payload).not.toHaveProperty("source_text");
  });

  it("passes a pasted lesson plan or scenario as source text", () => {
    expect(buildPresentationCreateInput({
      ...common,
      source: "pasted",
      topic: "",
      pastedTitle: "  Ашық сабақ  ",
      pastedText: "  Сабақтың басында оқушылар топқа бөлінеді.  ",
    })).toMatchObject({
      title: "Ашық сабақ",
      topic: "Ашық сабақ",
      source_kind: "scenario",
      source_text: "Сабақтың басында оқушылар топқа бөлінеді.",
    });
  });

  it("requires the source-specific field without exposing backend details", () => {
    expect(validatePresentationSource({
      source: "saved_kmzh",
      topic: "",
      pastedTitle: "",
      pastedText: "",
    })).toBe("saved_kmzh");
    expect(validatePresentationSource({
      source: "pasted",
      topic: "",
      pastedTitle: "Атауы",
      pastedText: "",
    })).toBe("pasted_text");
  });
});
