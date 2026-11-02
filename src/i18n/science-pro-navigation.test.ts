import { describe, expect, it } from "vitest";
import { resolveNavAccess, SEGMENTS } from "./navigation";

describe("Scientific Research PRO navigation", () => {
  it("provides a separate authenticated school workspace and preserves both existing tools", () => {
    const school = SEGMENTS.find(segment => segment.key === "school")!;
    const group = school.groups.find(group => group.items.some(item => item.key === "science-pro"))!;
    const item = group.items.find(item => item.key === "science-pro")!;
    expect(item.href).toBe("/dashboard/ai/science-pro");
    expect(item.soon).not.toBe(true);
    expect(resolveNavAccess(item, group)).toBe("authenticated");
    expect(group.items.some(item => item.key === "sciproject")).toBe(true);
    expect(group.items.some(item => item.key === "zerde")).toBe(true);
    expect(SEGMENTS.filter(segment => segment.key !== "school").flatMap(segment => segment.groups.flatMap(group => group.items)).some(item => item.key === "science-pro")).toBe(false);
  });
});
