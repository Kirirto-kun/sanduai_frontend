import { ApiRequestError } from "@/lib/http-client";

/** Development-only failure classification: never log URLs, headers or payloads. */
export function diagnoseVideoRead(operation: string, error: unknown): void {
  if (process.env.NODE_ENV !== "development") return;
  const known = error instanceof ApiRequestError;
  console.warn(
    "[video-read] " +
      JSON.stringify({
        operation,
        name: known
          ? "ApiRequestError"
          : error instanceof TypeError
            ? "TypeError"
            : "Error",
        code: known ? error.code : "UNCLASSIFIED",
        status: known ? error.status : 0,
        // HTTP response text and arbitrary Error.message may contain signed media URLs.
        message: known ? `Request failed (${error.code})` : "Video read failed",
      }),
  );
}
