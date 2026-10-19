/** Merge independent edits from another tab without overwriting a contested field. */
export function mergeVideoDraft<T>(
  baseline: T,
  local: T,
  remote: T,
): { draft: T; conflicts: string[] } {
  const conflicts: string[] = [];
  const equal = (a: unknown, b: unknown) =>
    JSON.stringify(a) === JSON.stringify(b);
  function merge(
    baseValue: unknown,
    localValue: unknown,
    remoteValue: unknown,
    path: string,
  ): unknown {
    if (equal(localValue, baseValue)) return remoteValue;
    if (equal(remoteValue, baseValue) || equal(localValue, remoteValue))
      return localValue;
    if (
      baseValue &&
      localValue &&
      remoteValue &&
      typeof baseValue === "object" &&
      typeof localValue === "object" &&
      typeof remoteValue === "object" &&
      !Array.isArray(baseValue) &&
      !Array.isArray(localValue) &&
      !Array.isArray(remoteValue)
    ) {
      const base = baseValue as Record<string, unknown>,
        own = localValue as Record<string, unknown>,
        server = remoteValue as Record<string, unknown>;
      return Object.fromEntries(
        [
          ...new Set([
            ...Object.keys(base),
            ...Object.keys(own),
            ...Object.keys(server),
          ]),
        ].map((key) => [
          key,
          merge(
            base[key],
            own[key],
            server[key],
            path ? `${path}.${key}` : key,
          ),
        ]),
      );
    }
    conflicts.push(path);
    return localValue;
  }
  return { draft: merge(baseline, local, remote, "") as T, conflicts };
}
