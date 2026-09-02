import type {
  AdminUserAccessResponse,
  AdminUser,
  DeleteAdminUserResponse,
} from "./api";
import { teacherFacingErrorMessage, type TeacherFacingLanguage } from "./teacher-facing-error";

export type AdminUserActionKind = "revoke-subscription" | "reset-tokens" | "delete-user";

export type AdminUserActionResult =
  | AdminUserAccessResponse
  | DeleteAdminUserResponse;

type ErrorRecord = Record<string, unknown>;

function asRecord(value: unknown): ErrorRecord | null {
  return value !== null && typeof value === "object" ? value as ErrorRecord : null;
}

function serverCode(error: unknown): string {
  const details = asRecord(asRecord(error)?.details);
  const detail = asRecord(details?.detail);
  const source = detail ?? details;
  return typeof source?.code === "string" ? source.code.trim().toUpperCase() : "";
}

function statusCode(error: unknown): number | undefined {
  const status = asRecord(error)?.status;
  return typeof status === "number" ? status : undefined;
}

function transportCode(error: unknown): string {
  const code = asRecord(error)?.code;
  return typeof code === "string" ? code.trim().toUpperCase() : "";
}

export function isAmbiguousAdminUserDeleteError(error: unknown): boolean {
  const status = statusCode(error);
  const code = transportCode(error);
  return status === undefined || status === 0 || status === 408 || status === 425 ||
    status === 429 || (typeof status === "number" && status >= 500) ||
    code === "TIMEOUT" || code === "NETWORK_ERROR" || code === "ABORTED";
}

export function reconciledDeletedAdminUserResult(userId: string): DeleteAdminUserResponse {
  return {
    user_id: userId,
    balance: 0,
    subscription_plan: "free",
    subscription_end: null,
    has_subscription: false,
    message: "User is already deleted",
    deleted: true,
  };
}

export function isAdminUserNotFoundError(error: unknown): boolean {
  return statusCode(error) === 404 || transportCode(error) === "NOT_FOUND";
}

export function isProtectedAdminUser(target: AdminUser, currentUserId?: string): boolean {
  return target.role === "admin" || target.user_id === currentUserId;
}

export function isExactEmailConfirmation(value: string, expectedEmail: string): boolean {
  return value.trim().toLocaleLowerCase() === expectedEmail.trim().toLocaleLowerCase();
}

export function applyAdminUserAction(
  users: AdminUser[],
  action: AdminUserActionKind,
  result: AdminUserActionResult,
): AdminUser[] {
  if (action === "delete-user") {
    return users.filter((user) => user.user_id !== result.user_id);
  }

  return users.map((user) => {
    if (user.user_id !== result.user_id) return user;

    return {
      ...user,
      balance: result.balance,
      has_subscription: result.has_subscription,
      subscription_plan: result.subscription_plan,
      subscription_end: result.subscription_end,
    };
  });
}

export function adminUserActionErrorMessage(
  error: unknown,
  language: TeacherFacingLanguage,
  action: AdminUserActionKind,
): string {
  const code = serverCode(error);
  const status = statusCode(error);

  if (
    code.includes("SELF") ||
    code.includes("LAST_ADMIN") ||
    code === "ADMIN_ACCOUNT_PROTECTED" ||
    code.includes("ADMIN_PROTECTED") ||
    code.includes("PROTECTED_ADMIN")
  ) {
    return language === "kk"
      ? "Әкімші аккаунтын немесе өз аккаунтыңызды бұл жерден өзгертуге болмайды."
      : "Нельзя изменить аккаунт администратора или собственный аккаунт из этого раздела.";
  }

  if (code === "USER_HAS_ACTIVE_GENERATIONS" || status === 409) {
    return language === "kk"
      ? "Пайдаланушыда қазір орындалып жатқан жұмыс бар. Ол аяқталғаннан кейін қайта көріңіз."
      : "У пользователя сейчас выполняется работа. Дождитесь её завершения и попробуйте снова.";
  }

  const fallback = {
    "revoke-subscription": language === "kk"
      ? "Жазылымды тоқтату мүмкін болмады. Қайталап көріңіз."
      : "Не удалось снять подписку. Попробуйте ещё раз.",
    "reset-tokens": language === "kk"
      ? "Токен балансын нөлдеу мүмкін болмады. Қайталап көріңіз."
      : "Не удалось обнулить токены. Попробуйте ещё раз.",
    "delete-user": language === "kk"
      ? "Пайдаланушыны жою мүмкін болмады. Қайталап көріңіз."
      : "Не удалось удалить пользователя. Попробуйте ещё раз.",
  } satisfies Record<AdminUserActionKind, string>;

  return teacherFacingErrorMessage(error, language, { fallback: fallback[action] });
}
