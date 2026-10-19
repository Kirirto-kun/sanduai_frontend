/** Public asset paths come from the API, whose origin differs from the page. */
export function sharedMasterclassCoverUrl(value: string | null | undefined, apiBase: string): string | null {
  if (!value) return null;
  try {
    const target = new URL(value, `${apiBase.replace(/\/+$/, "")}/`);
    if (!["http:", "https:"].includes(target.protocol) || target.username || target.password) return null;
    return target.href;
  } catch {
    // An optional unavailable cover must not prevent accessing the worksheet
    // or submitting feedback for the whole workshop.
    return null;
  }
}
