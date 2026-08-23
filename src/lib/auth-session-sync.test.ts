import { afterEach, describe, expect, it, vi } from "vitest";

import {
  AUTH_SESSION_REVISION_KEY,
  publishAuthSessionChange,
  subscribeToAuthSessionChanges,
} from "./auth-session";

class MemoryStorage {
  private readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

function fakeWindow(): Window {
  const target = new EventTarget() as Window;
  Object.defineProperty(target, "localStorage", {
    configurable: true,
    value: new MemoryStorage(),
  });
  return target;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("auth session tab synchronization", () => {
  it("publishes a completed local session transition without credentials", () => {
    const currentWindow = fakeWindow();
    vi.stubGlobal("window", currentWindow);
    const listener = vi.fn();
    const unsubscribe = subscribeToAuthSessionChanges(listener);

    publishAuthSessionChange();

    expect(listener).toHaveBeenCalledTimes(1);
    expect(currentWindow.localStorage.getItem(AUTH_SESSION_REVISION_KEY)).toMatch(/^\d+:/);
    unsubscribe();
  });

  it("reacts to the cross-tab revision event and ignores unrelated storage", () => {
    const currentWindow = fakeWindow();
    vi.stubGlobal("window", currentWindow);
    const listener = vi.fn();
    const unsubscribe = subscribeToAuthSessionChanges(listener);

    const unrelated = new Event("storage");
    Object.defineProperty(unrelated, "key", { value: "unrelated" });
    currentWindow.dispatchEvent(unrelated);
    expect(listener).not.toHaveBeenCalled();

    const revision = new Event("storage");
    Object.defineProperty(revision, "key", { value: AUTH_SESSION_REVISION_KEY });
    currentWindow.dispatchEvent(revision);
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
  });
});
