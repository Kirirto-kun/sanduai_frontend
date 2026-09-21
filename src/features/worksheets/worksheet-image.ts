import type {
  WorksheetImageResult,
  WorksheetPreschoolGroup,
  WorksheetStylePreset,
  WorksheetTaskType,
} from "@/lib/api";
import { tryNormalizeContentLanguage } from "../../lib/content-languages";


export const WORKSHEET_IMAGE_KIND = "worksheet.image";
export const LEGACY_WORKSHEET_KIND = "worksheet.generate";
export const WORKSHEET_HISTORY_KINDS = [
  WORKSHEET_IMAGE_KIND,
  LEGACY_WORKSHEET_KIND,
] as const;

export const MAX_SOURCE_PAGES = 3;
export const MAX_SOURCE_PAGE_BYTES = 12 * 1024 * 1024;

export const WORKSHEET_PRESCHOOL_GROUPS = [
  "younger",
  "middle",
  "senior",
  "pre_primary",
] as const satisfies readonly WorksheetPreschoolGroup[];

export const WORKSHEET_PRESCHOOL_GROUP_AGES: Readonly<Record<WorksheetPreschoolGroup, number>> = {
  younger: 2,
  middle: 3,
  senior: 4,
  pre_primary: 5,
};

export type WorksheetAudienceTarget =
  | { grade: number }
  | { preschool_group: WorksheetPreschoolGroup };

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


export function parseWorksheetAudience(value: string): WorksheetAudienceTarget | null {
  if (value.startsWith("school:")) {
    const grade = Number(value.slice("school:".length));
    return Number.isInteger(grade) && grade >= 1 && grade <= 11 ? { grade } : null;
  }
  if (value.startsWith("preschool:")) {
    const group = value.slice("preschool:".length) as WorksheetPreschoolGroup;
    return WORKSHEET_PRESCHOOL_GROUPS.includes(group) ? { preschool_group: group } : null;
  }
  return null;
}


export function worksheetAudienceFromResult(
  result: Pick<WorksheetImageResult, "grade" | "preschool_group">,
): string | null {
  if (
    typeof result.preschool_group === "string"
    && WORKSHEET_PRESCHOOL_GROUPS.includes(result.preschool_group)
  ) {
    return `preschool:${result.preschool_group}`;
  }
  if (
    typeof result.grade === "number"
    && Number.isInteger(result.grade)
    && result.grade >= 1
    && result.grade <= 11
  ) {
    return `school:${result.grade}`;
  }
  return null;
}


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
    typeof result.cost_tokens === "number" &&
    (result.language === undefined || tryNormalizeContentLanguage(result.language) !== null)
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
