import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  json: vi.fn(),
  blob: vi.fn(),
  invalidate: vi.fn(),
}));
vi.mock("@/lib/api", () => ({ getToken: () => "session-token" }));
vi.mock("@/lib/api-base", () => ({
  getApiBase: () => "https://api.sandu.test",
}));
vi.mock("@/lib/http-client", async (original) => ({
  ...(await original<typeof import("@/lib/http-client")>()),
  requestJson: mocks.json,
  requestBlob: mocks.blob,
}));
vi.mock("@/lib/tokenCache", () => ({
  invalidateCachedBalance: mocks.invalidate,
}));
import { videoApi } from "./api";
import { ApiRequestError, API_ERROR_CODES } from "@/lib/http-client";
beforeEach(() => vi.clearAllMocks());
describe("video API contract", () => {
  it("keeps video speech language independent from the interface language during AI assistance", async () => {
    mocks.json.mockResolvedValue({
      enhanced_prompt: "Клубника и банан идут по улице.",
    });
    await videoApi.enhance("Клубника и банан", "ru", "kk", 8);
    await videoApi.plan({
      idea: "Клубника и банан",
      language: "ru",
      speech_language: "kk",
      scene_count: 1,
      total_duration: 5,
      model_id: "minimax/h3-max",
    });
    expect(mocks.json.mock.calls.map(([url]) => url)).toEqual([
      "https://api.sandu.test/api/video-generation/enhance",
      "https://api.sandu.test/api/video-generation/plan",
    ]);
    for (const [, init] of mocks.json.mock.calls) {
      expect(JSON.parse(init.body)).toMatchObject({
        language: "ru",
        speech_language: "kk",
      });
    }
    expect(mocks.invalidate).not.toHaveBeenCalled();
    expect(JSON.parse(mocks.json.mock.calls[0][1].body).duration).toBe(8);
  });
  it("does not retry a paid POST when the transport acknowledgement is lost", async () => {
    mocks.json.mockRejectedValueOnce(
      new ApiRequestError(
        "Network interrupted",
        0,
        undefined,
        API_ERROR_CODES.NETWORK_ERROR,
      ),
    );
    await expect(
      videoApi.generate("quote", "original-paid-key"),
    ).rejects.toMatchObject({ code: API_ERROR_CODES.NETWORK_ERROR });
    expect(mocks.json).toHaveBeenCalledOnce();
    expect(mocks.invalidate).not.toHaveBeenCalled();
  });
  it("retries a failed read once while preserving its authenticated request", async () => {
    vi.useFakeTimers();
    try {
      mocks.json
        .mockRejectedValueOnce(
          new ApiRequestError(
            "Network interrupted",
            0,
            undefined,
            API_ERROR_CODES.NETWORK_ERROR,
          ),
        )
        .mockResolvedValue({ items: [] });
      const result = videoApi.adminJobs();
      await vi.runAllTimersAsync();
      await expect(result).resolves.toEqual({ items: [] });
      expect(mocks.json).toHaveBeenCalledTimes(2);
      for (const [, init] of mocks.json.mock.calls) {
        expect(init.method).toBe("GET");
        expect(init.headers.get("Authorization")).toBe("Bearer session-token");
      }
    } finally {
      vi.useRealTimers();
    }
  });
  it("guards project writes by the editor's original revision", async () => {
    mocks.json.mockResolvedValue({ id: "project", revision: 8 });
    await videoApi.updateProject("project", {
      title: "Мой текст",
      expected_revision: 7,
    });
    const [, init] = mocks.json.mock.calls[0];
    expect(init.method).toBe("PATCH");
    expect(JSON.parse(init.body)).toEqual({
      title: "Мой текст",
      expected_revision: 7,
    });
  });
  it("checks version dependencies before deleting only the chosen version", async () => {
    mocks.json.mockResolvedValue({});
    await videoApi.versionDependencies("version");
    await videoApi.deleteVersion("version");
    expect(mocks.json.mock.calls[0][0]).toBe(
      "https://api.sandu.test/api/video-generation/versions/version/dependencies",
    );
    expect(mocks.json.mock.calls[1][0]).toBe(
      "https://api.sandu.test/api/video-generation/versions/version",
    );
    expect(mocks.json.mock.calls[1][1].method).toBe("DELETE");
    expect(mocks.json.mock.calls[1][1].body).toBeUndefined();
  });
  it("routes provider access checks and job reconciliation to administrator-only endpoints", async () => {
    mocks.json.mockResolvedValue({});
    await videoApi.adminCheckAccess("fal");
    await videoApi.adminReconcile("original-job");
    expect(mocks.json.mock.calls[0][0]).toBe(
      "https://api.sandu.test/api/video-generation/admin/providers/fal/check-access",
    );
    expect(mocks.json.mock.calls[1][0]).toBe(
      "https://api.sandu.test/api/video-generation/admin/jobs/original-job/reconcile",
    );
    expect(mocks.json.mock.calls[0][1].method).toBe("POST");
    expect(mocks.invalidate).not.toHaveBeenCalled();
  });
  it("sends the confirmed quote with the same explicit idempotency key and preserves cent precision", async () => {
    mocks.json.mockResolvedValue({
      id: "job",
      status: "queued",
      cost_tokens: "78.25",
    });
    expect(await videoApi.generate("quote", "one-paid-action")).toMatchObject({
      cost_tokens: "78.25",
    });
    const [url, init] = mocks.json.mock.calls[0];
    expect(url).toBe("https://api.sandu.test/api/video-generation/generate");
    expect(init.headers.get("Idempotency-Key")).toBe("one-paid-action");
    expect(init.headers.get("Authorization")).toBe("Bearer session-token");
    expect(JSON.parse(init.body)).toEqual({ quote_id: "quote" });
    expect(mocks.invalidate).toHaveBeenCalledOnce();
  });
  it("normalizes the paginated private library returned by the backend", async () => {
    mocks.json.mockResolvedValue({ items: [{ id: "own-project" }], total: 1 });
    expect(await videoApi.projects()).toEqual([{ id: "own-project" }]);
  });
  it("loads later library pages without hiding older active projects", async () => {
    mocks.json.mockResolvedValue({
      items: [{ id: "older-project" }],
      total: 64,
    });
    expect(await videoApi.projectPage(30)).toEqual({
      items: [{ id: "older-project" }],
      total: 64,
    });
    expect(mocks.json.mock.calls[0][0]).toBe(
      "https://api.sandu.test/api/video-generation/projects?limit=30&offset=30",
    );
  });
  it("respects the administrator's catalog limits and exact discrete durations", async () => {
    mocks.json.mockResolvedValue({
      models: [
        {
          id: "grok",
          name: "Grok",
          durations: [5, 10],
          resolutions: ["720p"],
          aspect_ratios: ["16:9"],
        },
      ],
      limits: {
        user_concurrency: 1,
        upload_limit_mb: 8,
        scene_limit: 3,
        project_duration_limit: 30,
      },
    });
    expect(await videoApi.catalog()).toMatchObject({
      max_scenes: 3,
      max_project_duration: 30,
      max_concurrent_jobs: 1,
      max_image_mb: 8,
      models: [{ label: "Grok", min_duration: 5, max_duration: 10 }],
    });
  });
  it("downloads private assets only with an authenticated request", async () => {
    const blob = new Blob(["movie"], { type: "video/mp4" });
    mocks.json.mockResolvedValue({
      id: "private-id",
      expires_at: "2099-10-19T10:00:00Z",
      url: "/api/video-generation/assets/private-id/content?access=short-lived-signature",
    });
    mocks.blob.mockResolvedValue(blob);
    expect((await videoApi.asset("private-id")).type).toBe("video/mp4");
    const [metadataURL, metadataInit] = mocks.json.mock.calls[0];
    expect(metadataURL).toBe(
      "https://api.sandu.test/api/video-generation/assets/private-id/url",
    );
    expect(metadataInit.headers.get("Authorization")).toBe(
      "Bearer session-token",
    );
    const [url, init] = mocks.blob.mock.calls[0];
    expect(url).toBe(
      "https://api.sandu.test/api/video-generation/assets/private-id/content?access=short-lived-signature",
    );
    expect(init.headers).toBeUndefined();
    expect(init.credentials).toBe("omit");
    expect(init.cache).toBe("no-store");
  });
  it("rejects an unexpected external signed asset URL before any media request", async () => {
    mocks.json.mockResolvedValue({
      id: "private-id",
      expires_at: "2099-10-19T10:00:00Z",
      url: "https://untrusted.test/file?access=signature",
    });
    await expect(videoApi.asset("private-id")).rejects.toThrow(
      "Invalid private video URL",
    );
    expect(mocks.blob).not.toHaveBeenCalled();
  });
  it("uses the protected reconciliation route for an administrator downloading another user's late result", async () => {
    mocks.json.mockResolvedValue({
      id: "late-asset",
      expires_at: "2099-10-19T10:00:00Z",
      url: "/api/video-generation/assets/late-asset/content?access=signature",
    });
    mocks.blob.mockResolvedValue(new Blob(["movie"]));
    await videoApi.asset("late-asset", undefined, "original-job");
    expect(mocks.json.mock.calls[0][0]).toBe(
      "https://api.sandu.test/api/video-generation/admin/jobs/original-job/reconciliation/asset-url",
    );
    expect(mocks.json.mock.calls[0][1].headers.get("Authorization")).toBe(
      "Bearer session-token",
    );
    expect(mocks.blob.mock.calls[0][1].headers).toBeUndefined();
  });
  it("uses only authenticated server expiry metadata and rejects missing or expired lifetimes before downloading", async () => {
    const onExpiry = vi.fn();
    mocks.json.mockResolvedValue({
      id: "private-id",
      expires_at: "2099-10-19T10:00:00Z",
      url: "/api/video-generation/assets/private-id/content?access=signature",
    });
    mocks.blob.mockResolvedValue(new Blob(["image"]));
    await videoApi.asset("private-id", undefined, undefined, onExpiry);
    expect(onExpiry).toHaveBeenCalledWith("2099-10-19T10:00:00Z");
    mocks.blob.mockClear();
    mocks.json.mockResolvedValue({
      id: "private-id",
      url: "/api/video-generation/assets/private-id/content?access=signature",
    });
    await expect(videoApi.asset("private-id")).rejects.toThrow(
      "Invalid private media expiry",
    );
    mocks.json.mockResolvedValue({
      id: "private-id",
      expires_at: "2000-01-01T00:00:00Z",
      url: "/api/video-generation/assets/private-id/content?access=signature",
    });
    await expect(videoApi.asset("private-id")).rejects.toMatchObject({
      status: 410,
    });
    expect(mocks.blob).not.toHaveBeenCalled();
  });
  it("exposes the earlier authenticated project deadline and rejects an expired project before transfer", async () => {
    const onExpiry = vi.fn();
    mocks.json.mockResolvedValue({
      id: "private-id",
      expires_at: "2099-10-19T11:00:00Z",
      project_expires_at: "2099-10-19T10:00:00Z",
      url: "/api/video-generation/assets/private-id/content?access=signature",
    });
    mocks.blob.mockResolvedValue(new Blob(["movie"]));
    await videoApi.asset("private-id", undefined, undefined, onExpiry);
    expect(onExpiry).toHaveBeenCalledWith("2099-10-19T10:00:00Z");
    mocks.blob.mockClear();
    mocks.json.mockResolvedValue({
      id: "private-id",
      expires_at: "2099-10-19T11:00:00Z",
      project_expires_at: "2000-01-01T00:00:00Z",
      url: "/api/video-generation/assets/private-id/content?access=signature",
    });
    await expect(videoApi.asset("private-id")).rejects.toMatchObject({
      status: 410,
    });
    expect(mocks.blob).not.toHaveBeenCalled();
  });
  it("does not deliver a completed blob after its project expires during the transfer", async () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date("2026-10-19T10:00:00Z"));
      mocks.json.mockResolvedValue({
        id: "private-id",
        expires_at: "2026-10-19T11:00:00Z",
        project_expires_at: "2026-10-19T10:00:01Z",
        url: "/api/video-generation/assets/private-id/content?access=signature",
      });
      mocks.blob.mockImplementationOnce(async () => {
        vi.setSystemTime(new Date("2026-10-19T10:00:02Z"));
        return new Blob(["movie"]);
      });
      await expect(videoApi.asset("private-id")).rejects.toMatchObject({
        status: 410,
      });
      expect(mocks.blob).toHaveBeenCalledOnce();
    } finally {
      vi.useRealTimers();
    }
  });
});
