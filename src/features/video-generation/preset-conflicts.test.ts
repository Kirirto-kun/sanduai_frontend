import { describe, expect, it } from "vitest";
import {
  hasUnresolvedPresetConflict,
  presetConflictKey,
} from "./preset-conflicts";
import type { VideoQuote } from "./types";

describe("explicit preset conflict acknowledgement", () => {
  const quote = {
    id: "quote-1",
    fingerprint: "snapshot-1",
    preset_conflicts: [
      { field: "camera", preset: "zoom in", reason_code: "EXPLICIT_CAMERA" },
    ],
  } as VideoQuote;
  it("requires a deliberate acknowledgement only when a verified conflict exists", () => {
    expect(hasUnresolvedPresetConflict(quote, "draft-1", "")).toBe(true);
    expect(
      hasUnresolvedPresetConflict(
        quote,
        "draft-1",
        presetConflictKey(quote, "draft-1"),
      ),
    ).toBe(false);
    expect(
      hasUnresolvedPresetConflict(
        { ...quote, preset_conflicts: [] },
        "draft-1",
        "",
      ),
    ).toBe(false);
  });
  it("does not reuse acceptance after an edit, new quote, or changed snapshot", () => {
    const acknowledged = presetConflictKey(quote, "draft-1");
    expect(hasUnresolvedPresetConflict(quote, "draft-2", acknowledged)).toBe(
      true,
    );
    expect(
      hasUnresolvedPresetConflict(
        { ...quote, id: "quote-2" },
        "draft-1",
        acknowledged,
      ),
    ).toBe(true);
    expect(
      hasUnresolvedPresetConflict(
        { ...quote, fingerprint: "snapshot-2" },
        "draft-1",
        acknowledged,
      ),
    ).toBe(true);
  });
});
