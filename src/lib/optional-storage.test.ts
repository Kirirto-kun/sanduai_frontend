import { afterEach, describe, expect, it, vi } from "vitest";
import { readOptionalStorage, writeOptionalStorage } from "./optional-storage";

afterEach(() => vi.unstubAllGlobals());

describe("optional preferences when browser storage is restricted", () => {
  it("keeps a preference usable in this tab when accessing storage throws", () => {
    vi.stubGlobal("window", {
      get localStorage() { throw new DOMException("Blocked by policy", "SecurityError"); },
    });
    expect(readOptionalStorage("blocked-language")).toBeNull();
    writeOptionalStorage("blocked-language", "kk");
    expect(readOptionalStorage("blocked-language")).toBe("kk");
  });

  it("prefers the selected value when an existing preference cannot be overwritten", () => {
    vi.stubGlobal("window", {
      localStorage: {
        getItem: () => "school",
        setItem: () => { throw new DOMException("Full", "QuotaExceededError"); },
      },
    });
    writeOptionalStorage("quota-segment", "library");
    expect(readOptionalStorage("quota-segment")).toBe("library");
  });

  it("retains persistent storage and external updates when it is available", () => {
    const values = new Map<string, string>();
    vi.stubGlobal("window", {
      localStorage: {
        getItem: (key: string) => values.get(key) ?? null,
        setItem: (key: string, value: string) => values.set(key, value),
      },
    });
    writeOptionalStorage("normal-language", "kk");
    expect(values.get("normal-language")).toBe("kk");
    values.set("normal-language", "ru");
    expect(readOptionalStorage("normal-language")).toBe("ru");
  });

  it("does not retain or expose preferences during server rendering", () => {
    vi.stubGlobal("window", undefined);
    writeOptionalStorage("server-language", "kk");
    expect(readOptionalStorage("server-language")).toBeNull();
    vi.stubGlobal("window", { localStorage: { getItem: () => null } });
    expect(readOptionalStorage("server-language")).toBeNull();
  });
});
