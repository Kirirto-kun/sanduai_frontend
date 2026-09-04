import type {
  WorksheetImageResult,
  WorksheetStylePreset,
  WorksheetTaskType,
} from "@/lib/api";


export const WORKSHEET_IMAGE_KIND = "worksheet.image";
export const LEGACY_WORKSHEET_KIND = "worksheet.generate";
export const WORKSHEET_HISTORY_KINDS = [
  WORKSHEET_IMAGE_KIND,
  LEGACY_WORKSHEET_KIND,
] as const;

export const MAX_SOURCE_PAGES = 3;
export const MAX_SOURCE_PAGE_BYTES = 12 * 1024 * 1024;

const SUPPORTED_SOURCE_PAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const STYLE_DIRECTIONS: Record<WorksheetStylePreset, string> = {
  bright:
    "Bright, colorful educational worksheet with friendly illustrations, clear sections and generous writing space.",
  calm:
    "Calm educational worksheet with soft colors, clean hierarchy, restrained illustrations and generous writing space.",
  print:
    "Black-and-white printable educational worksheet with crisp outlines, high contrast and no ink-heavy backgrounds.",
};

export type SourcePageLike = Pick<File, "name" | "size" | "type">;

export type SourcePageValidationIssue =
  | "too_many"
  | "unsupported_type"
  | "too_large";

export type WorksheetFormValidationIssue =
  | "subject_required"
  | "learning_source_required"
  | "task_type_required";


export function validateSourcePages(
  files: readonly SourcePageLike[],
): SourcePageValidationIssue | null {
  if (files.length > MAX_SOURCE_PAGES) return "too_many";
  if (files.some((file) => !SUPPORTED_SOURCE_PAGE_TYPES.has(file.type.toLowerCase()))) {
    return "unsupported_type";
  }
  if (files.some((file) => file.size > MAX_SOURCE_PAGE_BYTES)) return "too_large";
  return null;
}


export function validateWorksheetImageForm(input: {
  subject: string;
  topic: string;
  content: string;
  sourcePageCount: number;
  taskTypes: readonly WorksheetTaskType[];
}): WorksheetFormValidationIssue | null {
  if (!input.subject.trim()) return "subject_required";
  if (!input.topic.trim() && !input.content.trim() && input.sourcePageCount === 0) {
    return "learning_source_required";
  }
  if (input.taskTypes.length === 0) return "task_type_required";
  return null;
}


export function buildWorksheetStyleDescription(
  preset: WorksheetStylePreset,
  teacherNotes: string,
): string {
  const notes = teacherNotes.trim();
  return notes ? `${STYLE_DIRECTIONS[preset]} Teacher preference: ${notes}` : STYLE_DIRECTIONS[preset];
}


export function isWorksheetImageResult(value: unknown): value is WorksheetImageResult {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const result = value as Partial<WorksheetImageResult>;
  return (
    typeof result.title === "string" &&
    result.title.trim().length > 0 &&
    typeof result.image_url === "string" &&
    result.image_url.trim().length > 0 &&
    Array.isArray(result.answer_key) &&
    result.answer_key.every((entry) => typeof entry === "string") &&
    typeof result.cost_tokens === "number"
  );
}


export function safeWorksheetFileName(value: string): string {
  const normalized = value
    .trim()
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, "_")
    .slice(0, 80);
  return normalized || "worksheet";
}
