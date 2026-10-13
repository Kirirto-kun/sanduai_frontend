import { describe, expect, it } from "vitest";
import { sharedMasterclassCoverUrl } from "./public-assets";

describe("public masterclass cover links", () => {
  const path = "/masterclasses/shared/public-token/cover";

  it("uses the configured API origin for a root-relative cover in production", () => {
    expect(sharedMasterclassCoverUrl(path, "https://api.sanduai.kz")).toBe(`https://api.sanduai.kz${path}`);
    expect(sharedMasterclassCoverUrl(path, "https://api.sanduai.kz/")).toBe(`https://api.sanduai.kz${path}`);
  });

  it("continues to resolve the same cover on the local API", () => {
    expect(sharedMasterclassCoverUrl(path, "http://127.0.0.1:8000")).toBe(`http://127.0.0.1:8000${path}`);
  });

  it("preserves absolute cover URLs returned by an earlier backend", () => {
    for (const base of ["https://api.sanduai.kz", "http://127.0.0.1:8000"]) {
      expect(sharedMasterclassCoverUrl(`${base}${path}`, base)).toBe(`${base}${path}`);
    }
  });

  it("ignores absent or invalid optional covers while keeping participant materials available", () => {
    for (const value of [undefined, null, "", "http://[", "javascript:alert(1)", "data:text/html,cover", "https://user:password@api.sanduai.kz/cover"]) {
      expect(sharedMasterclassCoverUrl(value, "https://api.sanduai.kz")).toBeNull();
    }
  });
});
