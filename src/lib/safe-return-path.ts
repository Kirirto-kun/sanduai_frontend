const FALLBACK_RETURN_PATH = "/dashboard";

/**
 * Accept only an app-local absolute path. Browsers treat backslashes in special
 * URLs as slashes, so a value such as `/\\evil.example` must be rejected even
 * though it appears to start with a single forward slash.
 */
export function safeReturnPath(value: string | null | undefined): string {
  if (
    !value
    || value.length > 1000
    || !value.startsWith("/")
    || value.startsWith("//")
    || value.includes("\\")
    || /[\u0000-\u001f\u007f]/.test(value)
  ) return FALLBACK_RETURN_PATH;

  try {
    const base = new URL("https://sandu.local");
    const target = new URL(value, base);
    if (target.origin !== base.origin || !target.pathname.startsWith("/")) return FALLBACK_RETURN_PATH;
    return `${target.pathname}${target.search}${target.hash}`;
  } catch {
    return FALLBACK_RETURN_PATH;
  }
}
