import type { Language } from "@/i18n/translations";

import { API_ERROR_CODES, ApiRequestError } from "./http-client";

const GENERIC_API_ERROR_CODES = new Set<string>(Object.values(API_ERROR_CODES));

export type AuthErrorContext =
  | "login"
  | "registration-code"
  | "register"
  | "password-reset-request"
  | "password-reset-confirm";

export const AUTH_FORM_COPY = {
  ru: {
    common: {
      email: "Электронная почта",
      password: "Пароль",
      newPassword: "Новый пароль",
      repeatPassword: "Повторите пароль",
      fullName: "ФИО",
      phone: "Телефон (необязательно)",
      optional: "Необязательно",
      backToLogin: "Вернуться ко входу",
      loading: "Пожалуйста, подождите…",
    },
    login: {
      title: "Вход в Sandu AI",
      subtitle: "Введите почту и пароль, указанные при регистрации.",
      submit: "Войти",
      forgot: "Забыли пароль?",
      register: "Нет аккаунта? Зарегистрироваться",
    },
    register: {
      title: "Регистрация учителя",
      subtitle: "Подтвердите почту и получите 150 монет для генерации материалов.",
      stepEmail: "Шаг 1 из 2 — подтвердите почту",
      stepDetails: "Шаг 2 из 2 — заполните данные",
      sendCode: "Получить код",
      code: "Код из письма",
      codeHint: "Мы отправили шестизначный код на {email}.",
      resend: "Отправить код ещё раз",
      resendIn: "Новый код можно запросить через {seconds} сек.",
      changeEmail: "Изменить почту",
      submit: "Создать аккаунт",
      signIn: "Уже есть аккаунт? Войти",
      passwordHint: "Не менее 8 символов.",
      phoneHint: "Номер нужен только для вашего профиля. SMS отправлять не будем.",
      termsPrefix: "Регистрируясь, вы принимаете",
      termsLink: "условия использования",
    },
    forgot: {
      title: "Восстановление пароля",
      subtitle: "Введите почту, указанную при регистрации.",
      submit: "Отправить письмо",
      sentTitle: "Проверьте почту",
      sentMessage:
        "Если аккаунт с такой почтой существует, мы отправили ссылку для сброса пароля. Проверьте также папку «Спам».",
    },
    reset: {
      title: "Новый пароль",
      subtitle: "Придумайте новый пароль для аккаунта.",
      submit: "Сохранить новый пароль",
      successTitle: "Пароль изменён",
      successMessage: "Теперь можно войти с новым паролем.",
      login: "Перейти ко входу",
      missingToken: "Ссылка недействительна. Запросите новое письмо для сброса пароля.",
    },
    validation: {
      required: "Заполните обязательные поля.",
      email: "Введите корректный адрес электронной почты.",
      code: "Введите шестизначный код из письма.",
      password: "Пароль должен содержать не менее 8 символов.",
      passwordTooLong: "Пароль слишком длинный. Используйте более короткий пароль.",
      passwordsMismatch: "Пароли не совпадают.",
      fullName: "Введите ФИО длиной от 2 до 100 символов.",
      phone: "Введите телефон в международном формате, например +77011234567.",
    },
    errors: {
      invalidCredentials: "Неверная почта или пароль.",
      emailExists: "Аккаунт с такой почтой уже зарегистрирован. Войдите или восстановите пароль.",
      invalidCode: "Код не подошёл. Проверьте цифры и попробуйте ещё раз.",
      expiredCode: "Срок действия кода истёк. Запросите новый код.",
      codeAttempts: "Слишком много неверных попыток. Запросите новый код.",
      resetInvalid: "Ссылка недействительна или уже использована. Запросите новое письмо.",
      resetExpired: "Срок действия ссылки истёк. Запросите новое письмо.",
      rateLimited: "Слишком много попыток. Подождите немного и попробуйте снова.",
      deliveryUnavailable: "Сейчас не удалось отправить письмо. Попробуйте ещё раз через несколько минут.",
      network: "Не удалось связаться с сервисом. Подождите немного и попробуйте снова.",
      coordination: "Для безопасного входа разрешите сайту сохранять данные и откройте его в обновлённом браузере.",
      service: "Сервис временно недоступен. Попробуйте ещё раз через несколько минут.",
      invalidFields: "Проверьте введённые данные и попробуйте снова.",
      generic: "Не удалось выполнить действие. Попробуйте ещё раз.",
    },
  },
  kk: {
    common: {
      email: "Электрондық пошта",
      password: "Құпиясөз",
      newPassword: "Жаңа құпиясөз",
      repeatPassword: "Құпиясөзді қайталаңыз",
      fullName: "Аты-жөні",
      phone: "Телефон (міндетті емес)",
      optional: "Міндетті емес",
      backToLogin: "Кіруге оралу",
      loading: "Күте тұрыңыз…",
    },
    login: {
      title: "Sandu AI жүйесіне кіру",
      subtitle: "Тіркелген кезде көрсеткен поштаңыз бен құпиясөзіңізді енгізіңіз.",
      submit: "Кіру",
      forgot: "Құпиясөзді ұмыттыңыз ба?",
      register: "Аккаунтыңыз жоқ па? Тіркелу",
    },
    register: {
      title: "Мұғалімді тіркеу",
      subtitle: "Поштаңызды растаңыз және материал жасауға 150 монета алыңыз.",
      stepEmail: "2 қадамның 1-қадамы — поштаны растаңыз",
      stepDetails: "2 қадамның 2-қадамы — деректерді толтырыңыз",
      sendCode: "Код алу",
      code: "Хаттағы код",
      codeHint: "Алты таңбалы кодты {email} поштасына жібердік.",
      resend: "Кодты қайта жіберу",
      resendIn: "Жаңа кодты {seconds} секундтан кейін сұрауға болады.",
      changeEmail: "Поштаны өзгерту",
      submit: "Аккаунт ашу",
      signIn: "Аккаунтыңыз бар ма? Кіру",
      passwordHint: "Кемінде 8 таңба.",
      phoneHint: "Нөмір тек профиліңіз үшін қажет. SMS жіберілмейді.",
      termsPrefix: "Тіркелу арқылы сіз",
      termsLink: "пайдалану шарттарын қабылдайсыз",
    },
    forgot: {
      title: "Құпиясөзді қалпына келтіру",
      subtitle: "Тіркелген кезде көрсеткен поштаңызды енгізіңіз.",
      submit: "Хат жіберу",
      sentTitle: "Поштаңызды тексеріңіз",
      sentMessage:
        "Егер бұл поштаға тіркелген аккаунт болса, құпиясөзді өзгерту сілтемесін жібердік. «Спам» қалтасын да тексеріңіз.",
    },
    reset: {
      title: "Жаңа құпиясөз",
      subtitle: "Аккаунтыңызға жаңа құпиясөз ойлап табыңыз.",
      submit: "Жаңа құпиясөзді сақтау",
      successTitle: "Құпиясөз өзгертілді",
      successMessage: "Енді жаңа құпиясөзбен кіре аласыз.",
      login: "Кіру бетіне өту",
      missingToken: "Сілтеме жарамсыз. Құпиясөзді өзгерту хатын қайта сұраңыз.",
    },
    validation: {
      required: "Міндетті жолдарды толтырыңыз.",
      email: "Дұрыс электрондық пошта мекенжайын енгізіңіз.",
      code: "Хаттағы алты таңбалы кодты енгізіңіз.",
      password: "Құпиясөз кемінде 8 таңбадан тұруы керек.",
      passwordTooLong: "Құпиясөз тым ұзын. Қысқарақ құпиясөз қолданыңыз.",
      passwordsMismatch: "Құпиясөздер сәйкес келмейді.",
      fullName: "Аты-жөніңізді 2–100 таңба аралығында енгізіңіз.",
      phone: "Телефонды халықаралық форматта енгізіңіз, мысалы +77011234567.",
    },
    errors: {
      invalidCredentials: "Пошта немесе құпиясөз қате.",
      emailExists: "Бұл поштаға аккаунт тіркелген. Жүйеге кіріңіз немесе құпиясөзді қалпына келтіріңіз.",
      invalidCode: "Код сәйкес келмеді. Сандарды тексеріп, қайта көріңіз.",
      expiredCode: "Кодтың мерзімі аяқталды. Жаңа код сұраңыз.",
      codeAttempts: "Қате код тым көп енгізілді. Жаңа код сұраңыз.",
      resetInvalid: "Сілтеме жарамсыз немесе қолданылған. Жаңа хат сұраңыз.",
      resetExpired: "Сілтеменің мерзімі аяқталды. Жаңа хат сұраңыз.",
      rateLimited: "Әрекет тым көп жасалды. Біраз күтіп, қайта көріңіз.",
      deliveryUnavailable: "Қазір хат жіберілмеді. Бірнеше минуттан кейін қайта көріңіз.",
      network: "Сервиске қосылу мүмкін болмады. Сәлден кейін қайта көріңіз.",
      coordination: "Қауіпсіз кіру үшін сайтқа деректерді сақтауға рұқсат беріп, жаңартылған браузерді қолданыңыз.",
      service: "Сервис уақытша қолжетімсіз. Бірнеше минуттан кейін қайта көріңіз.",
      invalidFields: "Енгізілген деректерді тексеріп, қайта көріңіз.",
      generic: "Әрекетті орындау мүмкін болмады. Қайта көріңіз.",
    },
  },
} as const;

export function authCopy(language: Language) {
  return AUTH_FORM_COPY[language];
}

export function normalizeEmail(value: string): string {
  return value.trim().toLocaleLowerCase("en-US");
}

export function isValidEmail(value: string): boolean {
  const candidate = value.trim();
  if (candidate.length > 254 || candidate.split("@").length !== 2) return false;
  const [local, rawDomain] = candidate.split("@");
  if (!local || local.length > 64 || local.startsWith(".") || local.endsWith(".") || local.includes("..")) {
    return false;
  }
  if (!/^[A-Za-z0-9!#$%&'*+/=?^_`{|}~.-]+$/.test(local)) return false;

  const domain = rawDomain.replace(/\.$/, "");
  if (!domain || domain.length > 253) return false;
  const labels = domain.split(".");
  if (labels.length < 2) return false;
  return labels.every(
    (label) =>
      label.length >= 1 &&
      label.length <= 63 &&
      !label.startsWith("-") &&
      !label.endsWith("-") &&
      /^[\p{L}\p{N}-]+$/u.test(label),
  );
}

export function normalizeFullName(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export function isValidFullName(value: string): boolean {
  const normalized = normalizeFullName(value);
  return normalized.length >= 2 && normalized.length <= 100 && !/[\u0000-\u001f\u007f]/.test(normalized);
}

export function normalizePhone(value: string): string {
  const candidate = value.trim();
  if (!candidate) return "";
  const compact = candidate.replace(/[\s().-]/g, "");
  return compact.startsWith("+") ? `+${compact.slice(1)}` : compact;
}

export function isValidOptionalPhone(value: string): boolean {
  const compact = normalizePhone(value);
  if (!compact) return true;
  if (!/^\+?[0-9]+$/.test(compact)) return false;
  const digits = compact.replace(/^\+/, "");
  return digits.length >= 8 && digits.length <= 15 && !digits.startsWith("0");
}

export function passwordValidationKey(value: string): "short" | "long" | null {
  if (value.length < 8) return "short";
  if (new TextEncoder().encode(value).length > 72) return "long";
  if (/[\u0000-\u001f\u007f]/.test(value) || /^\s+$/.test(value)) return "short";
  return null;
}

function backendErrorCode(error: unknown): string | null {
  if (!error || typeof error !== "object") return null;
  const direct = (error as { code?: unknown }).code;
  if (typeof direct === "string" && !GENERIC_API_ERROR_CODES.has(direct)) {
    return direct.toUpperCase();
  }
  const details = error instanceof ApiRequestError ? error.details : (error as { details?: unknown }).details;
  if (!details || typeof details !== "object") return null;
  const record = details as Record<string, unknown>;
  const detail = record.detail;
  for (const source of [record, detail]) {
    if (source && typeof source === "object") {
      const code = (source as Record<string, unknown>).code;
      if (typeof code === "string") return code.toUpperCase();
    }
  }
  return null;
}

export function authErrorMessage(
  error: unknown,
  language: Language,
  context: AuthErrorContext,
): string {
  const copy = authCopy(language);
  const code = backendErrorCode(error);

  if (code === "EMAIL_ALREADY_REGISTERED" || code === "ACCOUNT_ALREADY_EXISTS") return copy.errors.emailExists;
  if (code === "REGISTRATION_CODE_INVALID") return copy.errors.invalidCode;
  if (code === "REGISTRATION_CODE_EXPIRED") return copy.errors.expiredCode;
  if (code === "REGISTRATION_CODE_ATTEMPTS_EXCEEDED") return copy.errors.codeAttempts;
  if (code === "PASSWORD_RESET_TOKEN_INVALID") return copy.errors.resetInvalid;
  if (code === "PASSWORD_RESET_TOKEN_EXPIRED") return copy.errors.resetExpired;
  if (code === "REGISTRATION_CODE_RATE_LIMITED") return copy.errors.rateLimited;
  if (code === "EMAIL_DELIVERY_UNAVAILABLE") return copy.errors.deliveryUnavailable;
  if (code === "AUTH_SESSION_COORDINATION_UNAVAILABLE") return copy.errors.coordination;

  if (error instanceof ApiRequestError) {
    if (error.status === 0 || error.code === API_ERROR_CODES.NETWORK_ERROR || error.code === API_ERROR_CODES.TIMEOUT) {
      return copy.errors.network;
    }
    if (error.status === 429) return copy.errors.rateLimited;
    if (context === "login" && error.status === 401) return copy.errors.invalidCredentials;
    if (error.status === 409) return copy.errors.emailExists;
    if (error.status === 400 || error.status === 422) return copy.errors.invalidFields;
    if (error.status >= 500) return copy.errors.service;
  }

  return copy.errors.generic;
}
