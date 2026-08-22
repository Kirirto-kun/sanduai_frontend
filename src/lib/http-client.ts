import { notifyUnauthorizedOnce } from "./auth-session";

// Backend AI generation may run for up to 600 seconds. Keep the shared client
// deadline finite but slightly longer so the backend remains authoritative.
// Authentication refresh/logout use explicit short deadlines in api.ts.
export const DEFAULT_HTTP_TIMEOUT_MS = 620_000;

export const API_ERROR_CODES = {
  HTTP_ERROR: "HTTP_ERROR",
  BAD_REQUEST: "BAD_REQUEST",
  UNAUTHORIZED: "UNAUTHORIZED",
  PAYMENT_REQUIRED: "PAYMENT_REQUIRED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  RATE_LIMITED: "RATE_LIMITED",
  SERVER_ERROR: "SERVER_ERROR",
  TIMEOUT: "TIMEOUT",
  ABORTED: "ABORTED",
  NETWORK_ERROR: "NETWORK_ERROR",
  INVALID_RESPONSE: "INVALID_RESPONSE",
} as const;

export type ApiErrorCode = (typeof API_ERROR_CODES)[keyof typeof API_ERROR_CODES];

export function apiErrorCodeForStatus(status: number): ApiErrorCode {
  if (status === 400) return API_ERROR_CODES.BAD_REQUEST;
  if (status === 401) return API_ERROR_CODES.UNAUTHORIZED;
  if (status === 402) return API_ERROR_CODES.PAYMENT_REQUIRED;
  if (status === 403) return API_ERROR_CODES.FORBIDDEN;
  if (status === 404) return API_ERROR_CODES.NOT_FOUND;
  if (status === 409) return API_ERROR_CODES.CONFLICT;
  if (status === 422) return API_ERROR_CODES.VALIDATION_ERROR;
  if (status === 429) return API_ERROR_CODES.RATE_LIMITED;
  if (status >= 500) return API_ERROR_CODES.SERVER_ERROR;
  return API_ERROR_CODES.HTTP_ERROR;
}

export class ApiRequestError extends Error {
  readonly status: number;
  readonly code: ApiErrorCode;
  readonly details: unknown;

  constructor(
    message: string,
    status: number,
    details?: unknown,
    code: ApiErrorCode = apiErrorCodeForStatus(status),
  ) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export type ApiFailure = {
  message: string;
  status: number;
  code: ApiErrorCode;
  details?: unknown;
};

export type ApiErrorFactory = (failure: ApiFailure) => Error;

export type FetchPolicyOptions = {
  timeoutMs?: number | null;
  notifyOnUnauthorized?: boolean;
  attemptAuthRefresh?: boolean;
  errorFactory?: ApiErrorFactory;
};

export type AuthRefreshHandler = () => Promise<string | null>;

let authRefreshHandler: AuthRefreshHandler | null = null;
let authRefreshInFlight: Promise<string | null> | null = null;

/** Configure the one application-wide opaque-cookie refresh operation. */
export function configureAuthRefresh(handler: AuthRefreshHandler | null): void {
  authRefreshHandler = handler;
  authRefreshInFlight = null;
}

/**
 * Share one refresh across concurrent 401 responses. A failed refresh is
 * represented as null so callers can consistently enter the central logout
 * path without exposing cookie or transport details.
 */
export function refreshAccessToken(): Promise<string | null> {
  if (!authRefreshHandler) return Promise.resolve(null);
  if (authRefreshInFlight) return authRefreshInFlight;

  const refresh = authRefreshHandler;
  authRefreshInFlight = Promise.resolve()
    .then(() => refresh())
    .catch(() => null)
    .finally(() => {
      authRefreshInFlight = null;
    });
  return authRefreshInFlight;
}

export type ParsedResponsePayload = {
  data: unknown;
  rawText: string;
  isJson: boolean;
  isEmpty: boolean;
};

function makeError(failure: ApiFailure, factory?: ApiErrorFactory): Error {
  return factory?.(failure) ??
    new ApiRequestError(failure.message, failure.status, failure.details, failure.code);
}

function messageFromPayload(data: unknown, status: number): string {
  if (typeof data === "string" && data.trim()) return data.trim();
  if (data && typeof data === "object") {
    const record = data as Record<string, unknown>;
    const raw = record.detail ?? record.error ?? record.message;
    if (typeof raw === "string" && raw.trim()) return raw;
    if (raw && typeof raw === "object" && !Array.isArray(raw)) {
      const nested = raw as Record<string, unknown>;
      const nestedMessage = nested.message ?? nested.error;
      if (typeof nestedMessage === "string" && nestedMessage.trim()) {
        return nestedMessage;
      }
    }
    if (Array.isArray(raw)) {
      const messages = raw.map((entry) => {
        if (entry && typeof entry === "object" && "msg" in entry) {
          return String((entry as { msg: unknown }).msg);
        }
        return String(entry);
      });
      if (messages.length > 0) return messages.join("; ");
    }
  }
  return `Request failed with status ${status}`;
}

export async function readResponsePayload(response: Response): Promise<ParsedResponsePayload> {
  const rawText = await response.text();
  if (!rawText.trim()) {
    return { data: null, rawText, isJson: false, isEmpty: true };
  }

  try {
    return {
      data: JSON.parse(rawText) as unknown,
      rawText,
      isJson: true,
      isEmpty: false,
    };
  } catch {
    return { data: rawText, rawText, isJson: false, isEmpty: false };
  }
}

function normalizeTimeout(timeoutMs: number | null | undefined): number | null {
  if (timeoutMs === null) return null;
  if (typeof timeoutMs === "number" && Number.isFinite(timeoutMs) && timeoutMs > 0) {
    return timeoutMs;
  }
  return DEFAULT_HTTP_TIMEOUT_MS;
}

function effectiveHeaders(input: RequestInfo | URL, init: RequestInit): Headers {
  const headers = new Headers(input instanceof Request ? input.headers : undefined);
  new Headers(init.headers).forEach((value, key) => headers.set(key, value));
  return headers;
}

function hasBearerAuthorization(headers: Headers): boolean {
  return /^Bearer\s+\S+$/i.test(headers.get("Authorization") ?? "");
}

async function runWithFetchPolicy<T>(
  input: RequestInfo | URL,
  init: RequestInit,
  options: FetchPolicyOptions,
  consume: (response: Response) => Promise<T>,
): Promise<T> {
  const timeoutMs = normalizeTimeout(options.timeoutMs);
  const controller = new AbortController();
  const externalSignal = init.signal;
  let didTimeout = false;

  const abortFromExternal = () => controller.abort(externalSignal?.reason);
  if (externalSignal?.aborted) abortFromExternal();
  else externalSignal?.addEventListener("abort", abortFromExternal, { once: true });

  const timeout = timeoutMs === null
    ? undefined
    : setTimeout(() => {
        didTimeout = true;
        controller.abort();
      }, timeoutMs);

  try {
    const credentials = init.credentials ?? "include";
    const headers = effectiveHeaders(input, init);
    const retryInput = input instanceof Request ? input.clone() : input;
    let response = await fetch(input, {
      ...init,
      credentials,
      signal: controller.signal,
    });

    if (
      response.status === 401 &&
      options.attemptAuthRefresh !== false &&
      hasBearerAuthorization(headers) &&
      authRefreshHandler
    ) {
      const refreshedToken = await refreshAccessToken();
      if (refreshedToken) {
        await response.body?.cancel().catch(() => undefined);
        const retryHeaders = new Headers(headers);
        retryHeaders.set("Authorization", `Bearer ${refreshedToken}`);
        response = await fetch(retryInput, {
          ...init,
          credentials,
          headers: retryHeaders,
          signal: controller.signal,
        });
      }
    }

    if (response.status === 401 && options.notifyOnUnauthorized !== false) {
      notifyUnauthorizedOnce();
    }
    return await consume(response);
  } catch (error) {
    if (error instanceof ApiRequestError) throw error;

    if (didTimeout) {
      throw makeError(
        {
          message: "The request timed out.",
          status: 0,
          code: API_ERROR_CODES.TIMEOUT,
          details: { timeoutMs },
        },
        options.errorFactory,
      );
    }

    if (externalSignal?.aborted || controller.signal.aborted) {
      throw makeError(
        {
          message: "The request was cancelled.",
          status: 0,
          code: API_ERROR_CODES.ABORTED,
        },
        options.errorFactory,
      );
    }

    if (error instanceof TypeError) {
      throw makeError(
        {
          message: "Unable to reach the server.",
          status: 0,
          code: API_ERROR_CODES.NETWORK_ERROR,
        },
        options.errorFactory,
      );
    }

    throw error;
  } finally {
    if (timeout !== undefined) clearTimeout(timeout);
    externalSignal?.removeEventListener("abort", abortFromExternal);
  }
}

/** A single fetch attempt with timeout, composed cancellation and 401 signaling. */
export function fetchWithPolicy(
  input: RequestInfo | URL,
  init: RequestInit = {},
  options: FetchPolicyOptions = {},
): Promise<Response> {
  return runWithFetchPolicy(input, init, options, async (response) => response);
}

/**
 * JSON request policy. It deliberately never retries: callers that debit a
 * balance or enqueue paid work cannot be duplicated by the client.
 */
export function requestJson<T>(
  input: RequestInfo | URL,
  init: RequestInit = {},
  options: FetchPolicyOptions = {},
): Promise<T> {
  return runWithFetchPolicy(input, init, options, async (response) => {
    if (response.status === 204 && response.ok) return undefined as T;

    const payload = await readResponsePayload(response);
    if (!response.ok) {
      throw makeError(
        {
          message: messageFromPayload(payload.data, response.status),
          status: response.status,
          code: apiErrorCodeForStatus(response.status),
          details: payload.data,
        },
        options.errorFactory,
      );
    }

    if (payload.isEmpty || !payload.isJson) {
      throw makeError(
        {
          message: "The server returned an invalid JSON response.",
          status: response.status,
          code: API_ERROR_CODES.INVALID_RESPONSE,
          details: payload.rawText || null,
        },
        options.errorFactory,
      );
    }

    return payload.data as T;
  });
}

/** Test isolation helper. */
export function resetAuthRefreshForTests(): void {
  authRefreshHandler = null;
  authRefreshInFlight = null;
}
