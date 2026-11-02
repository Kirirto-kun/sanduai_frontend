import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { describe, expect, it, vi } from "vitest";

const script = readFileSync(new URL("../../public/browser-compatibility.js", import.meta.url), "utf8");

function checkBrowser(userAgent: string, hasLocks = true) {
  const setAttribute = vi.fn();
  runInNewContext(script, {
    navigator: { userAgent, ...(hasLocks ? { locks: { request() {} } } : {}) },
    document: { documentElement: { setAttribute } },
  });
  return setAttribute;
}

describe("independent browser compatibility notice", () => {
  it.each([
    "Mozilla/5.0 Chrome/109.0.0.0 Safari/537.36",
    "Mozilla/5.0 Firefox/115.0",
    "Mozilla/5.0 Version/16.3 Safari/605.1.15",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 15_8 like Mac OS X) CriOS/130.0 Mobile Safari/604.1",
    "Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.1; Trident/6.0)",
  ])("shows recovery guidance before React for %s", (userAgent) => {
    expect(checkBrowser(userAgent)).toHaveBeenCalledWith("data-sandu-browser", "unsupported");
  });

  it.each([
    "Mozilla/5.0 Chrome/111.0.0.0 Safari/537.36 Edg/111.0.0.0",
    "Mozilla/5.0 Firefox/128.0",
    "Mozilla/5.0 Version/16.4 Safari/605.1.15",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 16_4 like Mac OS X) CriOS/130.0 Mobile Safari/604.1",
  ])("leaves supported browsers unchanged for %s", (userAgent) => {
    expect(checkBrowser(userAgent)).not.toHaveBeenCalled();
  });

  it("also explains when browser policy or missing features prevent safe login", () => {
    expect(checkBrowser("Mozilla/5.0 Chrome/130.0.0.0 Safari/537.36", false))
      .toHaveBeenCalledWith("data-sandu-browser", "unsupported");
  });
});
