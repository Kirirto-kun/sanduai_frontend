/** One transport policy for durable generation reads. Job state remains untouched. */
export const GENERATION_POLL_RETRY_EVENT = "sanduai:retry-generation-polls";
const TERMINAL = new Set(["completed", "failed", "cancelled", "billing_error"]);
export type GenerationConnection = "connected" | "reconnecting" | "credentials" | "unavailable";

export function generationConnection(error: unknown): GenerationConnection {
  if (!error) return "connected";
  const status = error && typeof error === "object" && "status" in error ? Number(error.status) : 0;
  if (status === 401 || status === 403) return "credentials";
  if (status === 404 || status === 410 || (error instanceof Error && error.message === "MATERIAL_NOT_FOUND")) return "unavailable";
  return "reconnecting";
}

export function isTerminalGenerationPollError(error: unknown): boolean {
  const connection = generationConnection(error);
  return connection === "credentials" || connection === "unavailable";
}

export function generationRetryDelay(failures: number): number {
  return Math.min(30_000, 2_000 * 2 ** Math.min(4, Math.max(1, failures)));
}

type PollState = { error: unknown; fetchFailureCount: number; errorUpdateCount?: number; dataUpdatedAt?: number };
// TanStack resets fetchFailureCount on each new fetch; track consecutive failed reads per query.
const failuresByQuery = new WeakMap<object, { errorCount?: number; dataAt?: number; failures: number }>();
export function generationPollingInterval(state: PollState, healthyInterval: number | false, owner?: object): number | false {
  let failures = state.fetchFailureCount;
  if (owner) {
    const previous = failuresByQuery.get(owner);
    const record = previous && previous.dataAt === state.dataUpdatedAt ? previous : { dataAt: state.dataUpdatedAt, failures: 0, errorCount: state.error ? undefined : state.errorUpdateCount };
    if (state.error && (record.errorCount !== state.errorUpdateCount || !record.failures)) {
      record.failures++;
      record.errorCount = state.errorUpdateCount;
    }
    failuresByQuery.set(owner, record);
    failures = record.failures;
  }
  if (isTerminalGenerationPollError(state.error)) return false;
  return state.error ? generationRetryDelay(failures) : healthyInterval;
}

export function generationJobPollingInterval(query: { state: PollState & { data?: { status: string } } }): number | false {
  return generationPollingInterval(query.state, query.state.data && TERMINAL.has(query.state.data.status) ? false : 2_000, query);
}

export function isGenerationJobBusy(query: { data?: { status: string } | null; error: unknown; isPending: boolean }): boolean {
  return !query.error && (query.isPending || Boolean(query.data && !TERMINAL.has(query.data.status)));
}

export const generationPollingRecovery = {
  retry: false,
  refetchOnReconnect: true,
  refetchOnWindowFocus: true,
  meta: { generationPolling: true },
} as const;

/** Timer consumers share backoff, no-overlap, cancellation and browser recovery. */
export function startGenerationPolling<T extends { status: string }>({ read, onData, onError }: {
  read: () => Promise<T>;
  onData: (data: T) => void | boolean | Promise<void | boolean>;
  onError: (error: unknown) => void;
}): { retry(): void; stop(): void } {
  let stopped = false;
  let inFlight = false;
  let failures = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let complete = false;
  const poll = async () => {
    if (stopped || inFlight || complete) return;
    clearTimeout(timer);
    inFlight = true;
    let delay: number | false = false;
    try {
      const data = await read();
      if (stopped) return;
      const keepPolling = await onData(data);
      if (stopped) return;
      failures = 0;
      complete = keepPolling === undefined ? TERMINAL.has(data.status) : !keepPolling;
      delay = complete ? false : 2_000;
    } catch (error) {
      if (stopped) return;
      onError(error);
      failures++;
      delay = isTerminalGenerationPollError(error) ? false : generationRetryDelay(failures);
    } finally {
      inFlight = false;
      if (!stopped && delay !== false) timer = setTimeout(() => void poll(), delay);
    }
  };
  const retry = () => { if (!complete) void poll(); };
  const onFocus = () => { if (document.visibilityState === "visible") retry(); };
  if (typeof window !== "undefined") {
    window.addEventListener("online", retry);
    window.addEventListener("focus", retry);
    window.addEventListener(GENERATION_POLL_RETRY_EVENT, retry);
    document.addEventListener("visibilitychange", onFocus);
  }
  void poll();
  return {
    retry,
    stop() {
      stopped = true; clearTimeout(timer);
      if (typeof window !== "undefined") {
        window.removeEventListener("online", retry);
        window.removeEventListener("focus", retry);
        window.removeEventListener(GENERATION_POLL_RETRY_EVENT, retry);
        document.removeEventListener("visibilitychange", onFocus);
      }
    },
  };
}
