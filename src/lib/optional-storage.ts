// Only for non-sensitive preferences. Authentication must keep its durable
// storage checks and must never fall back to this tab-local store.
const tabValues = new Map<string, string>();

export function readOptionalStorage(key: string): string | null {
  if (typeof window === "undefined") return null;
  if (tabValues.has(key)) return tabValues.get(key) ?? null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeOptionalStorage(key: string, value: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, value);
    tabValues.delete(key);
  } catch {
    // Keep controls usable in this tab when browser policy or quota blocks storage.
    tabValues.set(key, value);
  }
}
