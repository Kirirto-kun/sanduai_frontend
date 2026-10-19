import { createIdempotencyKey } from "@/lib/idempotency";

export type VideoIntent = {
  schema: 1;
  userId: string;
  projectId: string;
  sceneId: string;
  quoteId: string;
  key: string;
  createdAt: string;
};
const prefix = "sanduai:video:intent:v1:";
export function readVideoIntent(
  userId: string,
  sceneId: string,
): VideoIntent | null {
  if (typeof window === "undefined") return null;
  try {
    const intent = JSON.parse(
      window.localStorage.getItem(`${prefix}${userId}:${sceneId}`) ?? "null",
    ) as VideoIntent | null;
    return intent?.schema === 1 &&
      intent.userId === userId &&
      intent.sceneId === sceneId
      ? intent
      : null;
  } catch {
    return null;
  }
}
export function createVideoIntent(
  userId: string,
  projectId: string,
  sceneId: string,
  quoteId: string,
): VideoIntent {
  const existing = readVideoIntent(userId, sceneId);
  if (existing) return existing;
  const intent: VideoIntent = {
    schema: 1,
    userId,
    projectId,
    sceneId,
    quoteId,
    key: createIdempotencyKey(),
    createdAt: new Date().toISOString(),
  };
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(
        `${prefix}${userId}:${sceneId}`,
        JSON.stringify(intent),
      );
    } catch {
      /* A private browser must still be usable. The key stays in component memory. */
    }
  }
  return intent;
}
export function clearVideoIntent(intent: VideoIntent): void {
  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem(
        `${prefix}${intent.userId}:${intent.sceneId}`,
      );
    } catch {
      /* Optional storage. */
    }
  }
}
export function rememberVideoProject(userId: string, id: string | null) {
  if (typeof window !== "undefined") {
    try {
      if (id)
        window.localStorage.setItem(`sanduai:video:last:v1:${userId}`, id);
      else window.localStorage.removeItem(`sanduai:video:last:v1:${userId}`);
    } catch {
      /* Optional recovery hint. */
    }
  }
}
export function lastVideoProject(userId: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(`sanduai:video:last:v1:${userId}`);
  } catch {
    return null;
  }
}
