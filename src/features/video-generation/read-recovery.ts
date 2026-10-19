import { ApiRequestError, API_ERROR_CODES } from "@/lib/http-client";
import { diagnoseVideoRead } from "./read-diagnostics";

export function isVideoReadNetworkError(error: unknown): boolean {
  return (
    error instanceof ApiRequestError &&
    error.status === 0 &&
    error.code === API_ERROR_CODES.NETWORK_ERROR
  );
}

function cancelled(): ApiRequestError {
  return new ApiRequestError(
    "The request was cancelled.",
    0,
    undefined,
    API_ERROR_CODES.ABORTED,
  );
}

function networkRecoveryDelay(signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(cancelled());
      return;
    }
    const abort = () => {
      clearTimeout(timer);
      signal?.removeEventListener("abort", abort);
      reject(cancelled());
    };
    const timer = globalThis.setTimeout(
      () => {
        signal?.removeEventListener("abort", abort);
        resolve();
      },
      300 + Math.floor(Math.random() * 200),
    );
    signal?.addEventListener("abort", abort, { once: true });
  });
}

/** One bounded retry for a read interrupted before an HTTP response. Never use for mutations. */
export async function recoverVideoRead<T>(
  operation: string,
  read: () => Promise<T>,
  signal?: AbortSignal,
): Promise<T> {
  if (signal?.aborted) throw cancelled();
  try {
    return await read();
  } catch (error) {
    if (!isVideoReadNetworkError(error) || signal?.aborted) throw error;
    diagnoseVideoRead(`${operation}-retry`, error);
    await networkRecoveryDelay(signal);
    return read();
  }
}
