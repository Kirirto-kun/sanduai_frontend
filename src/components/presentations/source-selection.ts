import type {
  CreatePresentationInput,
  PresentationMode,
  SavedKmzhSource,
} from "@/types/presentations";

export type PresentationSourceChoice = "topic" | "saved_kmzh" | "pasted";

export type PresentationSourceDraft = {
  mode: PresentationMode;
  source: PresentationSourceChoice;
  topic: string;
  subject: string;
  grade: string;
  pastedTitle: string;
  pastedText: string;
  selectedKmzh?: SavedKmzhSource;
  language: "ru" | "kk";
  slideCount: number;
};

export type PresentationSourceValidationError =
  | "topic"
  | "saved_kmzh"
  | "pasted_title"
  | "pasted_text"
  | null;

export function validatePresentationSource(
  draft: Pick<
    PresentationSourceDraft,
    "source" | "topic" | "pastedTitle" | "pastedText" | "selectedKmzh"
  >,
): PresentationSourceValidationError {
  if (draft.source === "topic") return draft.topic.trim() ? null : "topic";
  if (draft.source === "saved_kmzh") return draft.selectedKmzh ? null : "saved_kmzh";
  if (!draft.pastedTitle.trim()) return "pasted_title";
  return draft.pastedText.trim() ? null : "pasted_text";
}

export function buildPresentationCreateInput(
  draft: PresentationSourceDraft,
): CreatePresentationInput {
  const validationError = validatePresentationSource(draft);
  if (validationError) {
    throw new Error(`Invalid presentation source: ${validationError}`);
  }

  const slideCount = Math.max(6, Math.min(30, Math.trunc(draft.slideCount)));
  const common = {
    mode: draft.mode,
    language: draft.language,
    slide_count: slideCount,
    text_density: "balanced" as const,
    style: { preset: "clean" },
    theme_id: "academic_blue",
  };

  if (draft.source === "saved_kmzh") {
    const selected = draft.selectedKmzh!;
    return {
      ...common,
      title: selected.title,
      topic: selected.title,
      source_kind: "lesson_plan",
      source_generation_job_id: selected.id,
    };
  }

  if (draft.source === "pasted") {
    const title = draft.pastedTitle.trim();
    return {
      ...common,
      title,
      topic: title,
      source_kind: "scenario",
      source_text: draft.pastedText.trim(),
    };
  }

  const topic = draft.topic.trim();
  const subject = draft.subject.trim();
  const grade = draft.grade.trim();
  return {
    ...common,
    title: topic,
    topic,
    subject: subject || undefined,
    grade: grade || undefined,
    audience: grade || undefined,
    source_kind: "scratch",
  };
}
