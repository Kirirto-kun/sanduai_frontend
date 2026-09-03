import { API_ERROR_CODES, ApiRequestError } from "./http-client";

type Language = "kk" | "ru";

const COPY = {
  ru: {
    unavailable: "Не удалось создать изображение. Попробуйте ещё раз.",
    connection: "Не удалось связаться с сервисом. Подождите немного и попробуйте ещё раз.",
    invalidInput: "Проверьте заполненные поля и попробуйте ещё раз.",
  },
  kk: {
    unavailable: "Суретті жасау мүмкін болмады. Қайталап көріңіз.",
    connection: "Қызметке қосылу мүмкін болмады. Сәлден кейін қайталап көріңіз.",
    invalidInput: "Толтырылған өрістерді тексеріп, қайталап көріңіз.",
  },
} as const;

const IMAGE_SERVER_CODES = new Set([
  "IMAGE_SERVICE_UNAVAILABLE",
  "IMAGE_GENERATION_FAILED",
  "IMAGE_EDIT_FAILED",
]);

function serverCode(error: ApiRequestError): string | undefined {
  if (!error.details || typeof error.details !== "object") return undefined;
  const response = error.details as Record<string, unknown>;
  const detail = response.detail;
  const source = detail && typeof detail === "object"
    ? detail as Record<string, unknown>
    : response;
  return typeof source.code === "string" ? source.code.toUpperCase() : undefined;
}

/** Never render provider/configuration diagnostics on teacher-facing pages. */
export function visualGenerationErrorMessage(error: unknown, language: Language): string {
  const copy = COPY[language];
  if (!(error instanceof ApiRequestError)) return copy.unavailable;

  const code = serverCode(error);
  if (code && IMAGE_SERVER_CODES.has(code)) return copy.unavailable;

  if (
    error.code === API_ERROR_CODES.NETWORK_ERROR ||
    error.code === API_ERROR_CODES.TIMEOUT
  ) {
    return copy.connection;
  }
  if (
    error.code === API_ERROR_CODES.BAD_REQUEST ||
    error.code === API_ERROR_CODES.VALIDATION_ERROR
  ) {
    return copy.invalidInput;
  }
  return copy.unavailable;
}
