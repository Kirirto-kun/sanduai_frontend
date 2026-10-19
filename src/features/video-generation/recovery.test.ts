import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearVideoIntent,
  createVideoIntent,
  lastVideoProject,
  readVideoIntent,
  rememberVideoProject,
} from "./recovery";
class MemoryStorage {
  private entries = new Map<string, string>();
  getItem(key: string) {
    return this.entries.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.entries.set(key, value);
  }
  removeItem(key: string) {
    this.entries.delete(key);
  }
}
beforeEach(() =>
  vi.stubGlobal("window", { localStorage: new MemoryStorage() }),
);
afterEach(() => vi.unstubAllGlobals());
describe("paid video submission recovery", () => {
  it("reuses the original quote and key after a lost response, including a newly rendered button", () => {
    const initial = createVideoIntent(
      "user-a",
      "project",
      "scene",
      "confirmed-quote",
    );
    const retried = createVideoIntent(
      "user-a",
      "project",
      "scene",
      "new-estimate",
    );
    expect(retried).toEqual(initial);
    expect(readVideoIntent("user-a", "scene")?.quoteId).toBe("confirmed-quote");
    expect(readVideoIntent("user-b", "scene")).toBeNull();
    clearVideoIntent(initial);
    expect(
      createVideoIntent("user-a", "project", "scene", "new-estimate").key,
    ).not.toBe(initial.key);
  });
  it("isolates recovery hints by account", () => {
    rememberVideoProject("user-a", "private-project");
    expect(lastVideoProject("user-b")).toBeNull();
    expect(lastVideoProject("user-a")).toBe("private-project");
    rememberVideoProject("user-a", null);
    expect(lastVideoProject("user-a")).toBeNull();
  });
  it("tolerates corrupt and unavailable local storage", () => {
    vi.stubGlobal("window", {
      localStorage: {
        getItem: () => {
          throw new Error("denied");
        },
        setItem: () => {
          throw new Error("denied");
        },
        removeItem: () => {
          throw new Error("denied");
        },
      },
    });
    expect(readVideoIntent("user", "scene")).toBeNull();
    const intent = createVideoIntent("user", "project", "scene", "quote");
    expect(intent.key).toBeTruthy();
    expect(() => clearVideoIntent(intent)).not.toThrow();
  });
});
