/**
 * SSE streaming utility using fetch + ReadableStream.
 *
 * Unlike EventSource, this supports custom headers (Authorization),
 * which is required for authenticated SSE endpoints.
 */

import { getToken } from "./api";
import type { SSEEvent } from "@/types/presenton";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

/**
 * Async generator that yields parsed SSE events from an authenticated endpoint.
 *
 * Usage:
 * ```ts
 * for await (const evt of fetchSSE("/api/v1/presentations/presenton/generation/outlines/stream/123")) {
 *   if (evt.event === "outline") {
 *     const data = JSON.parse(evt.data);
 *   }
 * }
 * ```
 */
export async function* fetchSSE(
  path: string,
  signal?: AbortSignal,
): AsyncGenerator<SSEEvent> {
  const token = getToken();
  const headers: Record<string, string> = {
    Accept: "text/event-stream",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const resp = await fetch(`${API_BASE}${path}`, {
    headers,
    cache: "no-store",
    signal,
  });

  if (!resp.ok) {
    throw new Error(`SSE request failed: ${resp.status} ${resp.statusText}`);
  }

  const reader = resp.body?.getReader();
  if (!reader) {
    throw new Error("Response body is not readable");
  }

  const decoder = new TextDecoder();
  let buffer = "";
  let currentEvent = "message";
  let currentData = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      // Keep the last incomplete line in the buffer
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("event:")) {
          currentEvent = line.slice(6).trim();
        } else if (line.startsWith("data:")) {
          currentData += (currentData ? "\n" : "") + line.slice(5).trim();
        } else if (line === "") {
          // Empty line = end of event
          if (currentData) {
            yield { event: currentEvent, data: currentData };
          }
          currentEvent = "message";
          currentData = "";
        }
      }
    }

    // Flush remaining data
    if (currentData) {
      yield { event: currentEvent, data: currentData };
    }
  } finally {
    reader.releaseLock();
  }
}
