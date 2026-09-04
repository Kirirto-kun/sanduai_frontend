import { afterEach, describe, expect, it, vi } from "vitest";

const auth = vi.hoisted(() => ({ token: "preview-access-token" as string | null }));

vi.mock("@/lib/api", () => ({ getToken: () => auth.token }));
vi.mock("@/lib/api-base", () => ({ getApiBase: () => "http://127.0.0.1:8000" }));
vi.mock("@/lib/http-client", async () => import("../../lib/http-client"));

import { ApiError, fetchLibraryPreviewBlob } from "./api";

const API_BASE = "http://127.0.0.1:8000";
const PREVIEW_ID = "f1982b1e-acde-4f34-9e30-60c96352c8f1";

afterEach(() => {
  auth.token = "preview-access-token";
  vi.unstubAllGlobals();
});

describe("authenticated library preview API", () => {
  it.each([
    `/api/library/previews/${PREVIEW_ID}`,
    `/api/library/assets/${PREVIEW_ID}/preview`,
    `/api/admin/library/previews/${PREVIEW_ID}`,
    `/api/admin/library/assets/${PREVIEW_ID}/preview`,
  ])("fetches %s with bearer authentication and returns its blob", async (path) => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response("preview-bytes", {
        status: 200,
        headers: { "Content-Type": "image/png" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await fetchLibraryPreviewBlob(path);

    expect(result.type).toBe("image/png");
    expect(await result.text()).toBe("preview-bytes");
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [input, init] = fetchMock.mock.calls[0] as [URL, RequestInit];
    const headers = new Headers(init.headers);
    expect(String(input)).toBe(`${API_BASE}${path}`);
    expect(headers.get("Authorization")).toBe("Bearer preview-access-token");
    expect(headers.get("Accept")).toBe("image/*");
    expect(init.cache).toBe("no-store");
    expect(init.credentials).toBe("include");
  });

  it("fails before network access when no session token exists", async () => {
    auth.token = null;
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchLibraryPreviewBlob(`/api/library/previews/${PREVIEW_ID}`))
      .rejects.toMatchObject({
        name: "ApiError",
        status: 401,
        message: "Authentication required",
      } satisfies Partial<ApiError>);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    `https://files.example.com/api/library/previews/${PREVIEW_ID}`,
    `/api/library/content/${PREVIEW_ID}`,
    "/api/library/previews/not-a-valid-id",
  ])("does not leak the bearer token to an untrusted URL: %s", async (path) => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchLibraryPreviewBlob(path)).rejects.toMatchObject({
      name: "ApiError",
      status: 400,
      message: "Invalid library preview URL",
    } satisfies Partial<ApiError>);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
