import { describe, expect, it } from "vitest";

import { safeReturnPath } from "./safe-return-path";

describe("safeReturnPath", () => {
  it("keeps local app paths including their query and fragment", () => {
    expect(safeReturnPath("/dashboard/ai/builder?duplicate=project-1#studio"))
      .toBe("/dashboard/ai/builder?duplicate=project-1#studio");
  });

  it.each([
    "https://evil.example/",
    "//evil.example/",
    "/\\evil.example/",
    "\\\\evil.example/",
    "dashboard",
    "/dashboard\n/elsewhere",
  ])("rejects a non-local or ambiguous target: %s", value => {
    expect(safeReturnPath(value)).toBe("/dashboard");
  });

  it("uses the dashboard for an absent or excessively long target", () => {
    expect(safeReturnPath(null)).toBe("/dashboard");
    expect(safeReturnPath(`/${"a".repeat(1001)}`)).toBe("/dashboard");
  });
});
