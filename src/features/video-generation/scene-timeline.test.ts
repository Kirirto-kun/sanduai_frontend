import { describe, expect, it } from "vitest";
import {
  isValidSceneOrder,
  moveSceneToIndex,
  sameSceneOrder,
} from "./scene-timeline";

describe("scene timeline ordering", () => {
  it("preserves every scene exactly once for every drag destination", () => {
    const ids = ["first", "second", "third", "fourth"];
    for (const id of ids) {
      for (let position = 0; position < ids.length; position += 1) {
        const reordered = moveSceneToIndex(ids, id, position);
        expect(reordered[position]).toBe(id);
        expect(isValidSceneOrder(ids, reordered)).toBe(true);
      }
    }
    expect(ids).toEqual(["first", "second", "third", "fourth"]);
  });

  it("rejects stale, incomplete, duplicate and foreign reorder requests", () => {
    const ids = ["a", "b", "c"];
    for (const invalid of [
      ["a", "b"],
      ["a", "b", "b"],
      ["a", "b", "foreign"],
      ["a", "b", "c", "new-scene"],
    ])
      expect(isValidSceneOrder(ids, invalid)).toBe(false);
    expect(isValidSceneOrder(["a", "a"], ["a", "a"])).toBe(false);
    expect(isValidSceneOrder([], [])).toBe(true);
  });

  it("does not schedule writes for a no-op or invalid drag", () => {
    const ids = ["a", "b", "c"];
    expect(moveSceneToIndex(ids, "b", 1)).toBe(ids);
    expect(moveSceneToIndex(ids, "missing", 0)).toBe(ids);
    expect(moveSceneToIndex(ids, "a", Number.NaN)).toBe(ids);
    expect(moveSceneToIndex(ids, "a", Number.POSITIVE_INFINITY)).toBe(ids);
    expect(sameSceneOrder(ids, [...ids])).toBe(true);
    expect(sameSceneOrder(ids, ["b", "a", "c"])).toBe(false);
  });

  it("clamps edge drops and supports moving in both directions", () => {
    const ids = ["a", "b", "c"];
    expect(moveSceneToIndex(ids, "c", -10)).toEqual(["c", "a", "b"]);
    expect(moveSceneToIndex(ids, "a", 99)).toEqual(["b", "c", "a"]);
    expect(moveSceneToIndex(ids, "c", 1)).toEqual(["a", "c", "b"]);
    expect(moveSceneToIndex(ids, "a", 1)).toEqual(["b", "a", "c"]);
  });
});
