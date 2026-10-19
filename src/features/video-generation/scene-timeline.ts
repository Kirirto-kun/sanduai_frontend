/** A timeline reorder may only permute the scenes the caller already owns. */
export function isValidSceneOrder(
  currentIds: readonly string[],
  nextIds: readonly string[],
): boolean {
  if (currentIds.length !== nextIds.length) return false;
  const current = new Set(currentIds);
  return (
    current.size === currentIds.length &&
    new Set(nextIds).size === nextIds.length &&
    nextIds.every((id) => current.has(id))
  );
}

export function sameSceneOrder(
  currentIds: readonly string[],
  nextIds: readonly string[],
): boolean {
  return (
    currentIds.length === nextIds.length &&
    currentIds.every((id, index) => id === nextIds[index])
  );
}

/** Returns a new permutation, or the original array for an invalid/no-op move. */
export function moveSceneToIndex(
  currentIds: string[],
  sceneId: string,
  index: number,
): string[] {
  const from = currentIds.indexOf(sceneId);
  if (
    from < 0 ||
    !Number.isFinite(index) ||
    !isValidSceneOrder(currentIds, currentIds)
  )
    return currentIds;
  const to = Math.max(0, Math.min(currentIds.length - 1, Math.trunc(index)));
  if (from === to) return currentIds;
  const result = [...currentIds];
  result.splice(from, 1);
  result.splice(to, 0, sceneId);
  return result;
}
