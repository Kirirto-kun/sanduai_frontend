import { describe, expect, it } from "vitest";
import { resolveNavAccess, SEGMENTS } from "./navigation";

describe("Zerde contest entry", () => {
  it("opens the dedicated advisory workspace from the school tools", () => {
    const school = SEGMENTS.find(segment => segment.key === "school")!;
    const group = school.groups.find(group => group.items.some(item => item.key === "zerde"))!;
    const item = group.items.find(item => item.key === "zerde")!;
    expect(item.href).toBe("/dashboard/ai/zerde");
    expect(item.soon).not.toBe(true);
    expect(resolveNavAccess(item, group)).toBe("authenticated");
    expect(SEGMENTS.filter(segment => segment.key !== "school").flatMap(segment => segment.groups.flatMap(group => group.items)).some(item => item.key === "zerde")).toBe(false);
  });
});
