import { describe, expect, it } from "vitest";
import { getPresentationCopy } from "./copy";
import {
  ACTIVE_PRESENTATION_CREATION_MODE,
  PRESENTATION_CREATE_PATH,
  resolvePresentationCreationMode,
  shouldCanonicalizePresentationCreationMode,
  teacherVisibleCoinCost,
} from "./creation-policy";

describe("presentation creation policy", () => {
  it.each([undefined, null, "", "classic", "unknown", "creative"])(
    "routes %s creation requests to creative mode",
    (requestedMode) => {
      expect(resolvePresentationCreationMode(requestedMode)).toBe("creative");
      expect(ACTIVE_PRESENTATION_CREATION_MODE).toBe("creative");
    },
  );

  it("publishes one mode-free hub entry and canonicalizes stale Classic links", () => {
    expect(PRESENTATION_CREATE_PATH).toBe("/dashboard/ai/presentations/create");
    expect(PRESENTATION_CREATE_PATH).not.toContain("mode=");
    expect(shouldCanonicalizePresentationCreationMode("classic")).toBe(true);
    expect(shouldCanonicalizePresentationCreationMode("unknown")).toBe(true);
    expect(shouldCanonicalizePresentationCreationMode("creative")).toBe(false);
    expect(shouldCanonicalizePresentationCreationMode(null)).toBe(false);
  });

  it("exposes only the final coin charge, never provider or per-slide costs", () => {
    expect(teacherVisibleCoinCost({
      per_slide: 4,
      per_slide_kzt: 4,
      estimated_provider_cost_kzt: 40,
      estimated_provider_cost_kzt_per_slide: 4,
      cost_limit_kzt_per_slide: 10,
    })).toBeNull();
    expect(teacherVisibleCoinCost({ coin_cost: 80, retail_tokens: 90 })).toBe(80);
    expect(teacherVisibleCoinCost({ retail_tokens: 90 })).toBe(90);
  });

  it.each(["ru", "kk"] as const)("keeps %s teacher copy free of technical pricing", (language) => {
    const visibleCopy = Object.values(getPresentationCopy(language)).join(" ").toLowerCase();
    expect(visibleCopy).not.toMatch(/\bapi\b|provider|deepseek|gpt|per[ -]?slide/);
    expect(visibleCopy).not.toMatch(/за один слайд|бір слайд үшін|₸\s*\/\s*слайд|т\s*\/\s*слайд/);
  });
});
