import { describe, expect, it } from "vitest";
import { SEGMENTS } from "@/i18n/navigation";
import { generationMaterialFilterFromKind } from "./generation-history";

describe("coaching release on the live Science Pro baseline", () => {
  it("preserves Science Pro navigation while adding Coaching to every segment", () => {
    const school = SEGMENTS.find(segment => segment.key === "school")!;
    expect(school.groups.flatMap(group => group.items).find(item => item.key === "science-pro")?.href)
      .toBe("/dashboard/ai/science-pro");
    for (const segment of SEGMENTS) {
      expect(segment.groups.flatMap(group => group.items).filter(item => item.key === "coaching"))
        .toHaveLength(1);
    }
  });

  it("keeps unreleased Training out of navigation and retained material filters", () => {
    expect(SEGMENTS.flatMap(segment => segment.groups.flatMap(group => group.items))
      .some(item => item.key === "trainings" || item.href === "/dashboard/ai/trainings"))
      .toBe(false);
    expect(generationMaterialFilterFromKind("training.generate")).toBe("all");
    expect(generationMaterialFilterFromKind("coaching.generate")).toBe("coaching");
  });
});
