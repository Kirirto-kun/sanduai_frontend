export type JwtClaims = {
  sub?: string;
  role?: string;
  exp?: number;
  [claim: string]: unknown;
};

function decodeBase64Url(value: string): string {
  if (!value || !/^[A-Za-z0-9_-]+$/.test(value)) {
    throw new Error("Invalid base64url value");
  }

  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
}

export function decodeJwtPayload(token: string): JwtClaims | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3 || parts.some((part) => part.length === 0)) return null;

    const decoded: unknown = JSON.parse(decodeBase64Url(parts[1]));
    if (!decoded || typeof decoded !== "object" || Array.isArray(decoded)) return null;
    return decoded as JwtClaims;
  } catch {
    return null;
  }
}

/**
 * This is a client-side freshness check, not signature verification. The API
 * remains responsible for authenticating the JWT on every protected request.
 */
export function isUsableJwt(token: string, nowMs: number = Date.now()): boolean {
  const claims = decodeJwtPayload(token);
  return Boolean(
    claims &&
      typeof claims.exp === "number" &&
      Number.isFinite(claims.exp) &&
      claims.exp > Math.floor(nowMs / 1000),
  );
}

export function resolveBootstrapUser<T extends { userId: string; role?: string }>(
  token: string | null,
  cachedUser: T | null,
  nowMs: number = Date.now(),
): T | null {
  if (
    !token ||
    !cachedUser ||
    typeof cachedUser !== "object" ||
    typeof cachedUser.userId !== "string" ||
    cachedUser.userId.length === 0 ||
    !isUsableJwt(token, nowMs)
  ) {
    return null;
  }

  const claims = decodeJwtPayload(token);
  if (typeof claims?.sub === "string" && claims.sub !== cachedUser.userId) {
    return null;
  }

  if (!cachedUser.role && typeof claims?.role === "string") {
    return { ...cachedUser, role: claims.role };
  }

  return cachedUser;
}
