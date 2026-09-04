import { describe, expect, it } from "vitest";
import { SEGMENTS } from "../i18n/navigation";
import { SCHOOL_GRADES } from "./school-grades";

describe("school grade catalogue", () => {
  it("contains every school grade from 1 through 11 exactly once", () => {
    expect(SCHOOL_GRADES).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
    expect(new Set(SCHOOL_GRADES).size).toBe(11);
  });

  it.each([
    ["school-ready", "visual_aid"],
    ["school-homeroom", "safety_visual_aid"],
  ])("exposes all grades in the %s navigation group", (groupKey, materialType) => {
    const school = SEGMENTS.find((segment) => segment.key === "school");
    const group = school?.groups.find((entry) => entry.key === groupKey);
    const grades = (group?.items ?? [])
      .map((item) => new URL(item.href, "https://sanduai.kz").searchParams)
      .filter((params) => params.get("type") === materialType && params.has("grade"))
      .map((params) => Number(params.get("grade")));

    expect(grades).toEqual(SCHOOL_GRADES);
  });
});
