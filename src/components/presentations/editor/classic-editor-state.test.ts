import { describe, expect, it } from "vitest";
import { reconcilePersistedBaseline } from "./classic-editor-state";

describe("classic editor persisted baseline", () => {
  it("marks a remounted draft saved when the server confirms the same value", () => {
    expect(reconcilePersistedBaseline({
      currentDraft: "A",
      previousSaved: "O",
      nextPersisted: "A",
      pendingRequests: 0,
    })).toEqual({ saved: "A", requested: "A", replaceDraft: false });
  });

  it("keeps a newer local draft dirty over a confirmed server value", () => {
    expect(reconcilePersistedBaseline({
      currentDraft: "B",
      previousSaved: "O",
      nextPersisted: "A",
      pendingRequests: 0,
    })).toEqual({ saved: "A", requested: "A", replaceDraft: false });
  });

  it("adopts a remote value when there are no local changes", () => {
    expect(reconcilePersistedBaseline({
      currentDraft: "O",
      previousSaved: "O",
      nextPersisted: "A",
      pendingRequests: 0,
    })).toEqual({ saved: "A", requested: "A", replaceDraft: true });
  });
});
