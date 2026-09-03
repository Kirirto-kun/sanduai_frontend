import { afterEach, describe, expect, it, vi } from "vitest";

import {
  enqueueGenerationJob,
  validateGenerationJobAcknowledgement,
} from "./api";
import { API_ERROR_CODES } from "./http-client";

const JOB_ID = "30bdc3b2-41e6-4399-877c-cbab8e93a5d9";

describe("generation job acknowledgement", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("accepts only a persisted job identifier for the requested generator", () => {
    expect(validateGenerationJobAcknowledgement({
      id: JOB_ID,
      kind: "essay.generate",
      status: "queued",
    }, "essay.generate")).toMatchObject({ id: JOB_ID, status: "queued" });
  });

  it.each([
    [{ id: "not-a-job", kind: "essay.generate", status: "queued" }, "essay.generate"],
    [{ id: JOB_ID, kind: "article.generate", status: "queued" }, "essay.generate"],
    [{ id: JOB_ID, kind: "essay.generate", status: "unknown" }, "essay.generate"],
  ])("rejects malformed or mismatched acknowledgements", (value, kind) => {
    expect(() => validateGenerationJobAcknowledgement(value, kind)).toThrow(
      "invalid generation acknowledgement",
    );
  });

  it("trusts a job only after an exact 202 acknowledgement", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({
        id: JOB_ID,
        kind: "essay.generate",
        status: "queued",
      }), {
        status: 202,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(enqueueGenerationJob(
      "essay.generate",
      { topic: "Тақырып" },
      { idempotencyKey: "fixed-intent" },
    )).resolves.toMatchObject({ id: JOB_ID, status: "queued" });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0];
    expect(new Headers(init?.headers).get("Idempotency-Key")).toBe("fixed-intent");
  });

  it("does not announce success for a 200 response from the enqueue endpoint", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
      new Response(JSON.stringify({
        id: JOB_ID,
        kind: "essay.generate",
        status: "queued",
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    ));

    await expect(enqueueGenerationJob(
      "essay.generate",
      { topic: "Another topic" },
      { idempotencyKey: "fixed-intent-200" },
    )).rejects.toMatchObject({
      status: 200,
      code: API_ERROR_CODES.INVALID_RESPONSE,
    });
  });

  it("keeps one idempotency key across safe transport retries", async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn()
      .mockRejectedValueOnce(new TypeError("connection interrupted"))
      .mockResolvedValueOnce(new Response(JSON.stringify({ detail: "busy" }), {
        status: 503,
        headers: { "Content-Type": "application/json" },
      }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        id: JOB_ID,
        kind: "article.generate",
        status: "queued",
      }), {
        status: 202,
        headers: { "Content-Type": "application/json" },
      }));
    vi.stubGlobal("fetch", fetchMock);

    const enqueue = enqueueGenerationJob(
      "article.generate",
      { topic: "Retry" },
      { idempotencyKey: "stable-retry-intent" },
    );
    await vi.runAllTimersAsync();
    await expect(enqueue).resolves.toMatchObject({ id: JOB_ID });

    expect(fetchMock).toHaveBeenCalledTimes(3);
    for (const [, init] of fetchMock.mock.calls) {
      expect(new Headers(init?.headers).get("Idempotency-Key"))
        .toBe("stable-retry-intent");
    }
  });
});
