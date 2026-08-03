import { API_ERROR_CODES } from "../../lib/http-client";
import type { QaWarning } from "../../types/presentations";
import type { PresentationCopy } from "./copy";

type PresentationError = Error & {
  code: string;
  status: number;
  serverCode?: string;
};

function isPresentationError(error: unknown): error is PresentationError {
  return Boolean(
    error instanceof Error &&
    typeof (error as Partial<PresentationError>).code === "string" &&
    typeof (error as Partial<PresentationError>).status === "number",
  );
}

function normalizedServerCode(error: PresentationError): string {
  return (error.serverCode ?? "").trim().toLowerCase();
}

export function isSlidesNotReadyError(error: unknown): boolean {
  if (!isPresentationError(error)) return false;
  const code = normalizedServerCode(error);
  if (code === "slides_not_ready") return true;

  // Compatibility with jobs created before stable server error codes existed.
  // The original message is inspected but is never rendered to a user.
  const message = error.message.toLowerCase();
  return (
    message === "slides_not_ready" ||
    message.includes("all slides must be generated before export") ||
    (message.includes("slide") && message.includes("generated") && message.includes("export"))
  );
}

/** Maps transport/server failures to a small, teacher-friendly copy vocabulary. */
export function presentationErrorMessage(
  error: unknown,
  copy: PresentationCopy,
  fallback = copy.genericError,
): string {
  if (!isPresentationError(error)) return fallback;

  const serverCode = normalizedServerCode(error);
  if (serverCode === "slides_not_ready") return copy.exportSlidesNotReady;
  if (serverCode.includes("insufficient") || serverCode.includes("balance")) {
    return copy.paymentError;
  }
  if (serverCode.includes("revision") || serverCode.includes("conflict")) {
    return copy.revisionConflict;
  }

  switch (error.code) {
    case API_ERROR_CODES.NETWORK_ERROR:
    case API_ERROR_CODES.TIMEOUT:
      return copy.connectionError;
    case API_ERROR_CODES.UNAUTHORIZED:
      return copy.sessionError;
    case API_ERROR_CODES.PAYMENT_REQUIRED:
      return copy.paymentError;
    case API_ERROR_CODES.FORBIDDEN:
      return copy.permissionError;
    case API_ERROR_CODES.NOT_FOUND:
      return copy.notFoundError;
    case API_ERROR_CODES.RATE_LIMITED:
      return copy.rateLimitError;
    case API_ERROR_CODES.BAD_REQUEST:
    case API_ERROR_CODES.VALIDATION_ERROR:
      return copy.invalidInputError;
    case API_ERROR_CODES.CONFLICT:
      return copy.revisionConflict;
    default:
      return fallback;
  }
}

/** Keeps provider/OCR/debug wording out of the teacher-facing review panel. */
export function qaWarningMessage(warning: QaWarning, copy: PresentationCopy): string {
  const source = `${warning.code ?? ""} ${warning.message ?? ""}`.toLowerCase();
  if (source.includes("ocr") || source.includes("text") || source.includes("текст") || source.includes("мәтін")) {
    return copy.qaTextWarning;
  }
  if (source.includes("ratio") || source.includes("соотнош") || source.includes("aspect") || source.includes("қиыл")) {
    return copy.qaLayoutWarning;
  }
  if (source.includes("contrast") || source.includes("color") || source.includes("однотон") || source.includes("түс")) {
    return copy.qaColorWarning;
  }
  return copy.qaGenericWarning;
}
