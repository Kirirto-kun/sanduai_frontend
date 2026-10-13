import { describe, expect, it } from "vitest";
import { nextHistoryOffset, uniqueHistoryItems } from "./history-pagination";

describe("masterclass history pagination", () => {
  it("continues after the first thirty and stops after the final older works", () => {
    const first = { total: 35, items: Array.from({ length: 30 }, (_, index) => ({ id: `work_${index}` })) };
    const last = { total: 35, items: Array.from({ length: 5 }, (_, index) => ({ id: `work_${30 + index}` })) };
    expect(nextHistoryOffset(first, 0)).toBe(30);
    expect(nextHistoryOffset(last, 30)).toBeUndefined();
    expect(uniqueHistoryItems([first, last])).toHaveLength(35);
  });

  it("deduplicates shifted page boundaries while retaining the newer first-page item", () => {
    const pages = [
      { total: 5, items: [{ id: "new", title: "New" }, { id: "moved", title: "Updated title" }] },
      { total: 5, items: [{ id: "moved", title: "Older title" }, { id: "older", title: "Older" }] },
    ];
    expect(uniqueHistoryItems(pages)).toEqual([{ id: "new", title: "New" }, { id: "moved", title: "Updated title" }, { id: "older", title: "Older" }]);
    expect(nextHistoryOffset(pages[1], 2)).toBe(4);
    expect(pages[1].items[0].title).toBe("Older title");
  });

  it("stops on an empty page even when a stale total suggests more works", () => {
    expect(nextHistoryOffset({ items: [], total: 70 }, 60)).toBeUndefined();
  });

  it("stops when records were deleted between page loads and supports an empty history", () => {
    expect(nextHistoryOffset({ items: [{ id: "last" }], total: 28 }, 30)).toBeUndefined();
    expect(uniqueHistoryItems([])).toEqual([]);
    expect(uniqueHistoryItems([{ items: [], total: 0 }])).toEqual([]);
  });
});
