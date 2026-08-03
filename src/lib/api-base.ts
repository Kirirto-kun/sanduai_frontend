const DEVELOPMENT_API_BASE = "http://127.0.0.1:8000";

function permitsLocalApi(nodeEnv: string | undefined): boolean {
  return nodeEnv === "development" || nodeEnv === "test";
}

function isLoopbackHostname(hostname: string): boolean {
  const normalized = hostname.toLowerCase();
  return (
    normalized === "localhost" ||
    normalized.endsWith(".localhost") ||
    normalized === "0.0.0.0" ||
    normalized === "[::]" ||
    normalized === "[::1]" ||
    normalized === "host.docker.internal" ||
    /^127(?:\.\d{1,3}){3}$/.test(normalized)
  );
}

/**
 * Resolve the public backend URL once at each API-client boundary.
 *
 * Local fallback is deliberately restricted to development and tests. A
 * production build must receive an explicit public HTTPS URL so a successful
 * deployment can never make browsers call their own localhost by accident.
 */
export function resolveApiBase(
  rawValue: string | undefined,
  nodeEnv: string | undefined,
): string {
  const allowsLocal = permitsLocalApi(nodeEnv);
  const value = rawValue?.trim() || (allowsLocal ? DEVELOPMENT_API_BASE : "");

  if (!value) {
    throw new Error(
      "NEXT_PUBLIC_API_BASE is required outside development/test. " +
        "Set it to the public HTTPS backend URL before building the frontend.",
    );
  }

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(
      "NEXT_PUBLIC_API_BASE must be an absolute URL, for example https://api.example.com.",
    );
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("NEXT_PUBLIC_API_BASE must use HTTP or HTTPS.");
  }
  if (parsed.username || parsed.password) {
    throw new Error("NEXT_PUBLIC_API_BASE must not contain credentials.");
  }
  if (parsed.search || parsed.hash) {
    throw new Error("NEXT_PUBLIC_API_BASE must not contain a query string or fragment.");
  }

  if (!allowsLocal) {
    if (parsed.protocol !== "https:") {
      throw new Error("NEXT_PUBLIC_API_BASE must use HTTPS outside development/test.");
    }
    if (isLoopbackHostname(parsed.hostname)) {
      throw new Error(
        "NEXT_PUBLIC_API_BASE must not point to localhost or a loopback address outside development/test.",
      );
    }
  }

  return value.replace(/\/+$/, "");
}

export function getApiBase(): string {
  return resolveApiBase(
    process.env.NEXT_PUBLIC_API_BASE,
    process.env.NODE_ENV,
  );
}
