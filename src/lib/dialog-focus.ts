export function focusTrapTargetIndex(
  currentIndex: number,
  focusableCount: number,
  movingBackward: boolean,
): number | null {
  if (focusableCount <= 0) return null;

  if (movingBackward && currentIndex <= 0) return focusableCount - 1;
  if (!movingBackward && (currentIndex < 0 || currentIndex >= focusableCount - 1)) return 0;
  return null;
}

export type FocusRestoreCandidate = {
  connected: boolean;
  disabled: boolean;
  tabIndex: number;
  visible: boolean;
};

export function canRestoreDialogFocus(candidate: FocusRestoreCandidate): boolean {
  return candidate.connected && !candidate.disabled && candidate.tabIndex >= 0 && candidate.visible;
}
