import { generationPollingInterval } from "./generation-polling";
import type { OperationAvailability, PresentationCapabilities, PresentationOperation } from "@/types/presentations";

const TERMINAL = new Set(["completed", "completed_with_errors", "partial_failed", "failed", "error", "cancelled", "expired", "queue_expired"]);
export function isTerminalPresentationJob(status?: string | null): boolean {
  return Boolean(status && TERMINAL.has(status.toLowerCase()));
}

export function presentationOperationAvailability(
  capabilities: PresentationCapabilities | undefined,
  operation: PresentationOperation,
): OperationAvailability {
  const state = capabilities?.operations?.[operation];
  if (state === "cooldown" || state === "unavailable") return state;
  // Older capability payloads expose mode flags only. Export never inherits a
  // creative provider outage: its artifacts and local renderer are independent.
  if (operation === "creative_slides" && capabilities?.creative?.available === false) return "unavailable";
  if (operation === "classic_render" && capabilities?.classic?.available === false) return "unavailable";
  return state ?? "available";
}

export function isPresentationOperationBlocked(state: OperationAvailability): boolean {
  return state === "unavailable" || state === "cooldown";
}

type ReadState = {
  error: unknown;
  fetchFailureCount: number;
  errorUpdateCount?: number;
  dataUpdatedAt?: number;
  dataUpdateCount?: number;
};
const failures = new WeakMap<object, { count: number; errorCount?: number; dataAt?: number; dataCount?: number }>();

/** Five failed reads end automatic recovery; focus, reconnect and the read button remain available. */
export function presentationPollingInterval(state: ReadState, healthyInterval: number | false, query: object): number | false {
  const previous = failures.get(query);
  // With no cached data TanStack temporarily clears error while the next read
  // is pending. Only a genuine data update proves that recovery succeeded.
  const record = !previous || previous.dataAt !== state.dataUpdatedAt || previous.dataCount !== state.dataUpdateCount
    ? { count: 0, errorCount: undefined as number | undefined, dataAt: state.dataUpdatedAt, dataCount: state.dataUpdateCount }
    : previous;
  if (state.error && (record.errorCount !== state.errorUpdateCount || !record.count)) {
    record.count++;
    record.errorCount = state.errorUpdateCount;
  }
  failures.set(query, record);
  if (state.error && record.count >= 5) return false;
  const retryAfter = state.error && typeof state.error === "object" && "retryAfterSeconds" in state.error
    ? Number(state.error.retryAfterSeconds) * 1000
    : 0;
  const interval = generationPollingInterval(state, healthyInterval, query);
  return interval === false ? false : Math.max(interval, Number.isFinite(retryAfter) ? retryAfter : 0);
}
