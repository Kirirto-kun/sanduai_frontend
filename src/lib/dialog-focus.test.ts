import { describe, expect, it } from "vitest";

import { canRestoreDialogFocus, focusTrapTargetIndex } from "./dialog-focus";

describe("focusTrapTargetIndex", () => {
  it("wraps forward focus from the last element to the first", () => {
    expect(focusTrapTargetIndex(2, 3, false)).toBe(0);
  });

  it("wraps backward focus from the first element to the last", () => {
    expect(focusTrapTargetIndex(0, 3, true)).toBe(2);
  });

  it("moves focus into the dialog when it starts outside", () => {
    expect(focusTrapTargetIndex(-1, 3, false)).toBe(0);
    expect(focusTrapTargetIndex(-1, 3, true)).toBe(2);
  });

  it("leaves ordinary in-dialog tabbing to the browser", () => {
    expect(focusTrapTargetIndex(1, 3, false)).toBeNull();
    expect(focusTrapTargetIndex(1, 3, true)).toBeNull();
    expect(focusTrapTargetIndex(-1, 0, false)).toBeNull();
  });
});

describe("canRestoreDialogFocus", () => {
  it("restores only a connected, enabled and focusable visible trigger", () => {
    expect(canRestoreDialogFocus({ connected: true, disabled: false, tabIndex: 0, visible: true }))
      .toBe(true);
    expect(canRestoreDialogFocus({ connected: true, disabled: true, tabIndex: 0, visible: true }))
      .toBe(false);
    expect(canRestoreDialogFocus({ connected: false, disabled: false, tabIndex: 0, visible: true }))
      .toBe(false);
    expect(canRestoreDialogFocus({ connected: true, disabled: false, tabIndex: -1, visible: true }))
      .toBe(false);
  });
});
