import { describe, expect, it } from "vitest";
import type { PresentationSlide } from "@/types/presentations";
import { firstSlideImageSource } from "./slide-utils";

function slide(overrides: Partial<PresentationSlide>): PresentationSlide {
  return {
    slide_key: "slide",
    order: 1,
    status: "ready",
    ...overrides,
  };
}

describe("presentation card preview", () => {
  it("uses the generated asset from the first slide by deck order", () => {
    expect(firstSlideImageSource([
      slide({ slide_key: "second", order: 2, artifact_url: "/slides/second" }),
      slide({ slide_key: "first", order: 1, artifact_url: "/slides/first" }),
    ])).toBe("/slides/first");
  });

  it("uses the active first-slide version", () => {
    expect(firstSlideImageSource([
      slide({
        active_version_id: "active",
        versions: [
          { id: "old", artifact_url: "/slides/old" },
          { id: "active", artifact_url: "/slides/active" },
        ],
      }),
    ])).toBe("/slides/active");
  });

  it("does not replace a missing first slide with a later slide", () => {
    expect(firstSlideImageSource([
      slide({ slide_key: "second", order: 2, preview_url: "/slides/second" }),
      slide({ slide_key: "first", order: 1 }),
    ])).toBeNull();
  });

  it("returns no preview when a deck has no slides", () => {
    expect(firstSlideImageSource(undefined)).toBeNull();
    expect(firstSlideImageSource([])).toBeNull();
  });
});
