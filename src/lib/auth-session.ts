type UnauthorizedListener = () => void;
type AuthSessionChangeListener = () => void;

const unauthorizedListeners = new Set<UnauthorizedListener>();
const authSessionChangeListeners = new Set<AuthSessionChangeListener>();
let unauthorizedNotificationLatched = false;
let authSessionEventWindow: Window | null = null;

const AUTH_SESSION_CHANGED_EVENT = "sanduai:auth-session-changed";
export const AUTH_SESSION_REVISION_KEY = "sanduai_auth_session_revision";
export const AUTH_COOKIE_TRANSITION_LOCK = "sanduai-auth-cookie-transition";
export const AUTH_LOGOUT_TOMBSTONE_KEY = "sanduai_auth_logout_tombstone";

export class AuthSessionCoordinationError extends Error {
  readonly code = "AUTH_SESSION_COORDINATION_UNAVAILABLE";

  constructor() {
    super("This browser cannot safely coordinate authentication between tabs.");
    this.name = "AuthSessionCoordinationError";
  }
}

function notifyAuthSessionChangeListeners(): void {
  authSessionChangeListeners.forEach((listener) => listener());
}

function handleLocalAuthSessionChange(): void {
  notifyAuthSessionChangeListeners();
}

function handleAuthSessionStorageChange(event: StorageEvent): void {
  if (event.key === AUTH_SESSION_REVISION_KEY || event.key === null) {
    notifyAuthSessionChangeListeners();
  }
}

function attachAuthSessionWindowListeners(target: Window): void {
  target.addEventListener(AUTH_SESSION_CHANGED_EVENT, handleLocalAuthSessionChange);
  target.addEventListener("storage", handleAuthSessionStorageChange);
  authSessionEventWindow = target;
}

function detachAuthSessionWindowListeners(): void {
  if (!authSessionEventWindow) return;
  authSessionEventWindow.removeEventListener(AUTH_SESSION_CHANGED_EVENT, handleLocalAuthSessionChange);
  authSessionEventWindow.removeEventListener("storage", handleAuthSessionStorageChange);
  authSessionEventWindow = null;
}

/**
 * Subscribe to the single client-wide "the current session is no longer valid"
 * signal. The latch prevents a burst of concurrent 401 responses from causing
 * repeated state resets and redirects.
 */
export function subscribeToUnauthorized(listener: UnauthorizedListener): () => void {
  unauthorizedListeners.add(listener);

  if (unauthorizedNotificationLatched) {
    listener();
  }

  return () => {
    unauthorizedListeners.delete(listener);
  };
}

export function notifyUnauthorizedOnce(): void {
  if (unauthorizedNotificationLatched) return;

  unauthorizedNotificationLatched = true;
  unauthorizedListeners.forEach((listener) => listener());
}

/** Reset the 401 latch only after a new authenticated session is established. */
export function markAuthSessionActive(): void {
  unauthorizedNotificationLatched = false;
}

/** Test isolation helper; application code should use markAuthSessionActive. */
export function resetAuthSessionNotifications(): void {
  unauthorizedNotificationLatched = false;
  unauthorizedListeners.clear();
}

/**
 * Publish only after token and cached user storage have both been updated.
 * The custom event updates the current tab; the revision key's native
 * `storage` event updates every other tab without exposing credentials.
 */
export function publishAuthSessionChange(): void {
  if (typeof window === "undefined") return;

  const nonce = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
  window.localStorage.setItem(AUTH_SESSION_REVISION_KEY, `${Date.now()}:${nonce}`);
  window.dispatchEvent(new Event(AUTH_SESSION_CHANGED_EVENT));
}

/**
 * A persistent logout marker prevents a failed server logout from being
 * silently undone by the refresh cookie during the next page bootstrap.
 */
export function markAuthLogoutTombstone(reason: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    AUTH_LOGOUT_TOMBSTONE_KEY,
    JSON.stringify({ version: 1, reason, createdAt: Date.now() }),
  );
}

export function hasAuthLogoutTombstone(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(AUTH_LOGOUT_TOMBSTONE_KEY) !== null;
  } catch {
    // If storage cannot be read, refreshing a cookie-backed session would be
    // unsafe because an earlier logout intent cannot be ruled out.
    return true;
  }
}

export function clearAuthLogoutTombstone(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(AUTH_LOGOUT_TOMBSTONE_KEY);
}

/** Subscribe to completed auth-state transitions in this and other tabs. */
export function subscribeToAuthSessionChanges(
  listener: AuthSessionChangeListener,
): () => void {
  if (typeof window === "undefined") return () => undefined;
  authSessionChangeListeners.add(listener);
  if (!authSessionEventWindow) attachAuthSessionWindowListeners(window);
  return () => {
    authSessionChangeListeners.delete(listener);
    if (authSessionChangeListeners.size === 0) detachAuthSessionWindowListeners();
  };
}

/**
 * Refresh cookies are shared by every tab. Serializing cookie-changing auth
 * requests prevents a delayed logout response from clearing a newer login's
 * cookie in another tab.
 */
export function runAuthCookieTransition<T>(transition: () => Promise<T>): Promise<T> {
  // Server-side callers do not share a browser cookie jar or local state.
  if (typeof window === "undefined") return transition();

  if (
    typeof navigator === "undefined" ||
    !navigator.locks ||
    typeof navigator.locks.request !== "function"
  ) {
    // localStorage read/write leases are not an atomic compare-and-set and can
    // admit two owners. Failing closed is safer than racing refresh cookies.
    return Promise.reject(new AuthSessionCoordinationError());
  }

  return navigator.locks.request<Promise<T>>(
    AUTH_COOKIE_TRANSITION_LOCK,
    { mode: "exclusive" },
    transition,
  ).then((result) => result);
}
