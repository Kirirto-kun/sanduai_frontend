import { describe, expect, it } from "vitest";

import { readIntegrationPrefill } from "./integration-prefill";

describe("readIntegrationPrefill", () => {
  it("restores a prompt, canonical language and safe project type", () => {
    const params = new URLSearchParams({ prompt: "  Match the animals  ", language: "kyrgyz", type: "GAME" });
    expect(readIntegrationPrefill(params)).toEqual({ prompt: "Match the animals", language: "ky", type: "game" });
  });

  it("drops unsafe types, control characters and bounds the prompt", () => {
    const params = new URLSearchParams({ prompt: `a\u0000${"b".repeat(5_000)}`, type: "game<script>" });
    const result = readIntegrationPrefill(params);
    expect(result.prompt).not.toContain("\u0000");
    expect(result.prompt).toHaveLength(4_000);
    expect(result.type).toBeNull();
    expect(result.language).toBeNull();
  });
});
