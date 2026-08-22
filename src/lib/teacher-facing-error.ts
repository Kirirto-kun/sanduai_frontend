import { API_ERROR_CODES } from "./http-client";

export type TeacherFacingLanguage = "ru" | "kk";

export type TeacherFacingErrorOptions = {
  fallback?: string;
  insufficientCoins?: string;
};

const COPY = {
  ru: {
    generic: "Не удалось выполнить действие. Попробуйте ещё раз.",
    network: "Не удалось связаться с сервисом. Проверьте интернет и попробуйте ещё раз.",
    timeout: "Создание заняло больше времени, чем ожидалось. Попробуйте ещё раз.",
    unauthorized: "Сессия завершилась. Войдите снова и продолжите работу.",
    payment: "Недостаточно монет для этого действия.",
    forbidden: "Для этого действия недостаточно прав.",
    notFound: "Не удалось найти запрошенные данные. Обновите страницу и попробуйте ещё раз.",
    conflict: "Данные уже изменились. Обновите страницу и попробуйте ещё раз.",
    validation: "Проверьте заполненные поля и попробуйте ещё раз.",
    rateLimited: "Слишком много запросов. Немного подождите и попробуйте ещё раз.",
    server: "Сервис временно недоступен. Попробуйте ещё раз чуть позже.",
    cancelled: "Действие отменено.",
  },
  kk: {
    generic: "Әрекетті орындау мүмкін болмады. Қайталап көріңіз.",
    network: "Қызметпен байланысу мүмкін болмады. Интернетті тексеріп, қайталап көріңіз.",
    timeout: "Жасау күткеннен ұзаққа созылды. Қайталап көріңіз.",
    unauthorized: "Сеанс аяқталды. Қайта кіріп, жұмысты жалғастырыңыз.",
    payment: "Бұл әрекетке монета жеткіліксіз.",
    forbidden: "Бұл әрекетті орындауға рұқсат жеткіліксіз.",
    notFound: "Сұралған деректер табылмады. Бетті жаңартып, қайталап көріңіз.",
    conflict: "Деректер өзгеріп кетті. Бетті жаңартып, қайталап көріңіз.",
    validation: "Толтырылған өрістерді тексеріп, қайталап көріңіз.",
    rateLimited: "Сұрау тым көп. Сәл күтіп, қайталап көріңіз.",
    server: "Қызмет уақытша қолжетімсіз. Сәл кейінірек қайталап көріңіз.",
    cancelled: "Әрекет тоқтатылды.",
  },
} as const;

type ErrorRecord = Record<string, unknown>;

function asRecord(value: unknown): ErrorRecord | null {
  return value !== null && typeof value === "object" ? value as ErrorRecord : null;
}

function errorStatus(error: unknown): number | undefined {
  const record = asRecord(error);
  if (!record) return undefined;
  if (typeof record.status === "number") return record.status;
  const response = asRecord(record.response);
  return typeof response?.status === "number" ? response.status : undefined;
}

function errorCode(error: unknown): string {
  const record = asRecord(error);
  return typeof record?.code === "string" ? record.code.trim().toUpperCase() : "";
}

function serverCode(error: unknown): string {
  const details = asRecord(asRecord(error)?.details);
  const detail = asRecord(details?.detail);
  const source = detail ?? details;
  return typeof source?.code === "string" ? source.code.trim().toUpperCase() : "";
}

function errorName(error: unknown): string {
  const record = asRecord(error);
  if (typeof record?.name === "string") return record.name;
  return error instanceof Error ? error.name : "";
}

function internalMessage(error: unknown): string {
  return error instanceof Error ? error.message.toLowerCase() : "";
}

export class TeacherFacingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TeacherFacingError";
  }
}

/**
 * Converts transport, API and provider failures into a small RU/KK vocabulary.
 * Raw server/provider messages are inspected only for legacy classification and
 * are never returned to teacher-facing UI.
 */
export function teacherFacingErrorMessage(
  error: unknown,
  language: TeacherFacingLanguage,
  options: TeacherFacingErrorOptions = {},
): string {
  if (error instanceof TeacherFacingError) return error.message;

  const copy = COPY[language];
  const status = errorStatus(error);
  const code = errorCode(error);
  const upstreamCode = serverCode(error);
  const name = errorName(error);
  const message = internalMessage(error);

  const insufficient =
    name === "InsufficientTokensError" ||
    status === 402 ||
    code === API_ERROR_CODES.PAYMENT_REQUIRED ||
    upstreamCode.includes("INSUFFICIENT") ||
    upstreamCode.includes("BALANCE");
  if (insufficient) return options.insufficientCoins ?? copy.payment;

  if (status === 401 || code === API_ERROR_CODES.UNAUTHORIZED) return copy.unauthorized;
  if (status === 403 || code === API_ERROR_CODES.FORBIDDEN) return copy.forbidden;
  if (status === 404 || code === API_ERROR_CODES.NOT_FOUND) return copy.notFound;
  if (status === 409 || code === API_ERROR_CODES.CONFLICT) return copy.conflict;
  if (
    status === 400 ||
    status === 422 ||
    code === API_ERROR_CODES.BAD_REQUEST ||
    code === API_ERROR_CODES.VALIDATION_ERROR
  ) {
    return copy.validation;
  }
  if (status === 429 || code === API_ERROR_CODES.RATE_LIMITED) return copy.rateLimited;
  if (typeof status === "number" && status >= 500) return copy.server;
  if (code === API_ERROR_CODES.SERVER_ERROR || code === API_ERROR_CODES.INVALID_RESPONSE) {
    return copy.server;
  }
  if (
    code === API_ERROR_CODES.TIMEOUT ||
    message.includes("timed out") ||
    message.includes("timeout")
  ) {
    return copy.timeout;
  }
  if (
    code === API_ERROR_CODES.NETWORK_ERROR ||
    message.includes("failed to fetch") ||
    message.includes("network error") ||
    message.includes("unable to reach")
  ) {
    return copy.network;
  }
  if (code === API_ERROR_CODES.ABORTED || name === "AbortError") return copy.cancelled;

  return options.fallback?.trim() || copy.generic;
}

export function toTeacherFacingError(
  error: unknown,
  language: TeacherFacingLanguage,
  options?: TeacherFacingErrorOptions,
): TeacherFacingError {
  return new TeacherFacingError(teacherFacingErrorMessage(error, language, options));
}
