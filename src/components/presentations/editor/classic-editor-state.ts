export function reconcilePersistedBaseline({
  currentDraft,
  previousSaved,
  nextPersisted,
  pendingRequests,
}: {
  currentDraft: string;
  previousSaved: string;
  nextPersisted: string;
  pendingRequests: number;
}): {
  saved: string;
  requested: string | null;
  replaceDraft: boolean;
} {
  return {
    saved: nextPersisted,
    requested: pendingRequests === 0 ? nextPersisted : null,
    replaceDraft: pendingRequests === 0 && currentDraft === previousSaved,
  };
}
