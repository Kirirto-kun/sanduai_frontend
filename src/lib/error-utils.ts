import {
  teacherFacingErrorMessage,
  type TeacherFacingLanguage,
} from "./teacher-facing-error";

/** @deprecated Teacher UI should use useTeacherErrorMessage for current RU/KK copy. */
export function getErrorMessage(
  error: unknown,
  fallback: string,
  language: TeacherFacingLanguage = "ru",
): string {
  return teacherFacingErrorMessage(error, language, { fallback });
}

export function errorMessageIncludes(error: unknown, value: string): boolean {
  return error instanceof Error && error.message.toLowerCase().includes(value.toLowerCase());
}

export function getErrorCode(error: unknown): string | undefined {
  if (!error || typeof error !== "object" || !("code" in error)) return undefined;
  const code = (error as { code?: unknown }).code;
  return typeof code === "string" ? code : undefined;
}

export function getErrorStatus(error: unknown): number | undefined {
  if (!error || typeof error !== "object") return undefined;
  if ("status" in error && typeof (error as { status?: unknown }).status === "number") {
    return (error as { status: number }).status;
  }
  if ("response" in error) {
    const response = (error as { response?: unknown }).response;
    if (response && typeof response === "object" && "status" in response) {
      const status = (response as { status?: unknown }).status;
      return typeof status === "number" ? status : undefined;
    }
  }
  return undefined;
}
