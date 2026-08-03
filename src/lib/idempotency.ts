export const IDEMPOTENCY_HEADER = "Idempotency-Key";

/**
 * Create an identifier for one paid user action.
 *
 * Call this once before starting the transport operation. The resulting
 * headers object can be reused for transport-level retries of that same
 * action, while a new invocation naturally receives a new key.
 */
export function createIdempotencyKey(): string {
  return globalThis.crypto.randomUUID();
}

export function withIdempotencyKey(
  headers?: HeadersInit,
  key?: string,
): Headers {
  const result = new Headers(headers);
  if (!result.has(IDEMPOTENCY_HEADER)) {
    result.set(IDEMPOTENCY_HEADER, key ?? createIdempotencyKey());
  }
  return result;
}
