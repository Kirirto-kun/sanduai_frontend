type UnauthorizedListener = () => void;

const unauthorizedListeners = new Set<UnauthorizedListener>();
let unauthorizedNotificationLatched = false;

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
