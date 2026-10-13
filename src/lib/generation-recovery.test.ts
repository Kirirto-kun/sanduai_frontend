import { afterEach, describe, expect, it, vi } from "vitest";

import { enqueueGenerationJob, saveToken, waitForGenerationResult } from "./api";

const JOB_ID = "30bdc3b2-41e6-4399-877c-cbab8e93a5d9";

function json(value: unknown, status = 200): Response {
  return new Response(JSON.stringify(value), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function installBrowser(): Storage {
  const values = new Map<string, string>();
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
    removeItem: (key: string) => { values.delete(key); },
  } as Storage;
  const target = new EventTarget();
  Object.defineProperty(target, "localStorage", { value: storage });
  vi.stubGlobal("window", target);
  return storage;
}

function accessToken(owner: string, revision = 0): string {
  const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString("base64url");
  return `${encode({ alg: "none" })}.${encode({
    sub: owner,
    exp: Math.floor(Date.now() / 1_000) + 3_600 + revision,
  })}.signature`;
}

describe("generation recovery after intermittent connection failures", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("recovers the original server job after network and server interruptions without enqueueing twice", async () => {
    vi.useFakeTimers();
    const material = { title: "Ашық іс-әрекет", stages: ["Кіріспе", "Ойын"] };
    const fetchMock = vi.fn()
      .mockRejectedValueOnce(new TypeError("offline"))
      .mockResolvedValueOnce(json({ detail: "temporarily unavailable" }, 503))
      .mockResolvedValueOnce(json({ id: JOB_ID, status: "running", result: null }))
      .mockResolvedValueOnce(json({ id: JOB_ID, status: "settling", result: material }))
      .mockResolvedValueOnce(json({ id: JOB_ID, status: "completed", result: material }));
    vi.stubGlobal("fetch", fetchMock);

    const result = waitForGenerationResult<typeof material>(JOB_ID);
    await vi.runAllTimersAsync();

    await expect(result).resolves.toEqual(material);
    expect(fetchMock).toHaveBeenCalledTimes(5);
    for (const [url, init] of fetchMock.mock.calls) {
      expect(String(url)).toContain(`/api/v1/generations/${JOB_ID}`);
      expect(init.method).toBe("GET");
    }
  });

  it.each([408, 425, 429, 502, 504])("recovers a saved material after a temporary HTTP %s", async (status) => {
    vi.useFakeTimers();
    const material = { title: "Сақталған жұмыс" };
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(json({ detail: "try later" }, status))
      .mockResolvedValueOnce(json({ id: JOB_ID, status: "completed", result: material }));
    vi.stubGlobal("fetch", fetchMock);

    const result = waitForGenerationResult<typeof material>(JOB_ID);
    await vi.runAllTimersAsync();

    await expect(result).resolves.toEqual(material);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it.each([404, 410, 422])("stops when the original job is permanently unavailable (HTTP %s)", async (status) => {
    const fetchMock = vi.fn().mockResolvedValue(json({ detail: "not available" }, status));
    vi.stubGlobal("fetch", fetchMock);

    await expect(waitForGenerationResult(JOB_ID)).rejects.toMatchObject({ status });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("waits through refund settlement and preserves the terminal provider error", async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(json({ id: JOB_ID, status: "refunding", result: null }))
      .mockResolvedValueOnce(json({
        id: JOB_ID,
        status: "failed",
        result: null,
        error_code: "INVALID_PROVIDER_OUTPUT",
      }));
    vi.stubGlobal("fetch", fetchMock);

    const result = waitForGenerationResult(JOB_ID);
    const rejection = expect(result).rejects.toMatchObject({
      status: 502,
      details: { detail: { code: "INVALID_PROVIDER_OUTPUT" } },
    });
    await vi.runAllTimersAsync();

    await rejection;
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("shares one enqueue request for concurrent identical submissions with reordered fields", async () => {
    let resolveFetch!: (response: Response) => void;
    const fetchMock = vi.fn().mockImplementation(() => new Promise<Response>((resolve) => {
      resolveFetch = resolve;
    }));
    vi.stubGlobal("fetch", fetchMock);

    const first = enqueueGenerationJob("essay.generate", { topic: "Recovery", language: "kk" }, {
      idempotencyKey: "recovery-double-click",
    });
    const second = enqueueGenerationJob("essay.generate", { language: "kk", topic: "Recovery" }, {
      idempotencyKey: "recovery-double-click",
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    resolveFetch(json({ id: JOB_ID, kind: "essay.generate", status: "queued" }, 202));

    const jobs = await Promise.all([first, second]);
    expect(jobs.map((job) => job.id)).toEqual([JOB_ID, JOB_ID]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("starts a separate submission after account switch and never returns the earlier account's pending job", async () => {
    installBrowser();
    const pending: ((response: Response) => void)[] = [];
    const fetchMock = vi.fn().mockImplementation(() => new Promise<Response>((resolve) => {
      pending.push(resolve);
    }));
    vi.stubGlobal("fetch", fetchMock);
    const payload = { topic: "Same material after account switch" };

    saveToken(accessToken("teacher-a"));
    const first = enqueueGenerationJob("essay.generate", payload);
    const oldAccountRejection = expect(first).rejects.toMatchObject({
      status: 403,
      details: { detail: { code: "AUTH_SESSION_CHANGED" } },
    });
    saveToken(accessToken("teacher-b"));
    const second = enqueueGenerationJob("essay.generate", payload);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const secondId = "46b1a0bf-9e57-4b46-b116-f7e6f9ce7d5a";
    pending[0](json({ id: JOB_ID, kind: "essay.generate", status: "queued" }, 202));
    pending[1](json({ id: secondId, kind: "essay.generate", status: "queued" }, 202));

    await oldAccountRejection;
    await expect(second).resolves.toMatchObject({ id: secondId });
    const headers = fetchMock.mock.calls.map(([, init]) => new Headers(init.headers));
    expect(headers[0].get("Authorization")).not.toBe(headers[1].get("Authorization"));
    expect(headers[0].get("Idempotency-Key")).not.toBe(headers[1].get("Idempotency-Key"));
  });

  it("stops retrying the original account's paid request when the account changes during a connection outage", async () => {
    vi.useFakeTimers();
    installBrowser();
    const fetchMock = vi.fn().mockRejectedValueOnce(new TypeError("offline"));
    vi.stubGlobal("fetch", fetchMock);
    saveToken(accessToken("teacher-a"));

    const result = enqueueGenerationJob("article.generate", { topic: "Interrupted before account switch" });
    const rejection = expect(result).rejects.toMatchObject({
      details: { detail: { code: "AUTH_SESSION_CHANGED" } },
    });
    await vi.advanceTimersByTimeAsync(0);
    saveToken(accessToken("teacher-b"));
    await vi.runAllTimersAsync();

    await rejection;
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("keeps the same intent across access-token refresh for the original account", async () => {
    vi.useFakeTimers();
    installBrowser();
    const fetchMock = vi.fn()
      .mockRejectedValueOnce(new TypeError("offline"))
      .mockResolvedValueOnce(json({ id: JOB_ID, kind: "article.generate", status: "queued" }, 202));
    vi.stubGlobal("fetch", fetchMock);
    saveToken(accessToken("teacher-a"));

    const result = enqueueGenerationJob("article.generate", { topic: "Token refresh recovery" });
    await vi.advanceTimersByTimeAsync(0);
    saveToken(accessToken("teacher-a", 60));
    await vi.runAllTimersAsync();

    await expect(result).resolves.toMatchObject({ id: JOB_ID });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const firstHeaders = new Headers(fetchMock.mock.calls[0][1].headers);
    const secondHeaders = new Headers(fetchMock.mock.calls[1][1].headers);
    expect(firstHeaders.get("Idempotency-Key")).toBe(secondHeaders.get("Idempotency-Key"));
    expect(firstHeaders.get("Authorization")).not.toBe(secondHeaders.get("Authorization"));
  });

  it("reuses each owner's own persisted intent when reopening a page without borrowing another account's key", async () => {
    const storage = installBrowser();
    const fetchMock = vi.fn().mockImplementation(() => Promise.resolve(
      json({ id: JOB_ID, kind: "essay.generate", status: "queued" }, 202),
    ));
    vi.stubGlobal("fetch", fetchMock);
    const payload = { topic: "Recover on reopening the same form" };

    saveToken(accessToken("teacher-a"));
    await enqueueGenerationJob("essay.generate", payload);
    saveToken(accessToken("teacher-b"));
    await enqueueGenerationJob("essay.generate", payload);
    saveToken(accessToken("teacher-a", 60));
    await enqueueGenerationJob("essay.generate", payload);

    const keys = fetchMock.mock.calls.map(([, init]) => new Headers(init.headers).get("Idempotency-Key"));
    expect(keys[0]).not.toBe(keys[1]);
    expect(keys[2]).toBe(keys[0]);
    const persisted = JSON.parse(storage.getItem("sanduai_generation_intents_v1") ?? "{}");
    expect(Object.values(persisted).map((entry) => (entry as { owner: string }).owner).sort())
      .toEqual(["teacher-a", "teacher-b"]);
  });
});
