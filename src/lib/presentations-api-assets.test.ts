import { afterEach, describe, expect, it, vi } from "vitest";

const auth = vi.hoisted(() => ({ token: "presentation-access-token" as string | null }));

vi.mock("./api", () => ({ getToken: () => auth.token }));
vi.mock("./api-base", () => ({ getApiBase: () => "https://api.sanduai.kz" }));

import { fetchPresentationAsset } from "./presentations-api";

afterEach(() => {
  auth.token = "presentation-access-token";
  vi.unstubAllGlobals();
});

describe("presentation asset loading", () => {
  it.each([
    ["relative API path", "/api/v2/presentation-assets/slide-1", "https://api.sanduai.kz/api/v2/presentation-assets/slide-1", true],
    ["absolute own-API URL", "https://api.sanduai.kz/api/v2/presentation-assets/slide-1", "https://api.sanduai.kz/api/v2/presentation-assets/slide-1", true],
    ["absolute external URL", "https://cdn.example.com/slide-1.webp", "https://cdn.example.com/slide-1.webp", false],
  ])("loads a %s without leaking credentials", async (_label, source, expectedUrl, authenticated) => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response("image-bytes", { status: 200, headers: { "Content-Type": "image/webp" } }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await fetchPresentationAsset(source);

    expect(result.type).toBe("image/webp");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [input, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(input).toBe(expectedUrl);
    expect(new Headers(init.headers).get("Authorization")).toBe(
      authenticated ? "Bearer presentation-access-token" : null,
    );
  });

  it.each(["data:image/png;base64,aW1hZ2U=", "blob:https://sanduai.kz/slide-1"])(
    "accepts the browser-native source %s",
    async (source) => {
      const fetchMock = vi.fn().mockResolvedValue(
        new Response("image-bytes", { status: 200, headers: { "Content-Type": "image/png" } }),
      );
      vi.stubGlobal("fetch", fetchMock);

      const result = await fetchPresentationAsset(source);

      expect(result.type).toBe("image/png");
      expect(fetchMock).toHaveBeenCalledWith(source, { signal: undefined });
    },
  );
});
