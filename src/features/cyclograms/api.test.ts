import { afterEach, describe, expect, it, vi } from "vitest";

import { cyclogramApi } from "./api";

const JOB_ID = "30bdc3b2-41e6-4399-877c-cbab8e93a5d9";

function response(value: unknown, status = 200): Response {
  return new Response(JSON.stringify(value), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function accepted(kind = "cyclogram.generate"): Response {
  return response({ id: JOB_ID, kind, status: "queued", result: null }, 202);
}

describe("cyclogram paid API", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("requires the backend's durable 202 acknowledgement and expected job kind", async () => {
    const fetchMock = vi.fn().mockResolvedValue(accepted());
    vi.stubGlobal("fetch", fetchMock);

    await expect(cyclogramApi.generate({
      organization: "",
      group_id: "middle",
      age: 3,
      group_name: "Балапан",
      teacher_name: "Алия",
      week_start: "2026-09-14",
      weekly_theme: "Күз",
      notes: "",
      language: "kk",
    })).resolves.toMatchObject({ id: JOB_ID, kind: "cyclogram.generate" });

    const [, init] = fetchMock.mock.calls[0] as [RequestInfo, RequestInit];
    expect(new Headers(init.headers).get("Idempotency-Key")).toMatch(/^[0-9a-f-]{36}$/i);
  });

  it("rejects a successful response that is not an exact 202 acknowledgement", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response({ id: JOB_ID, kind: "cyclogram.generate", status: "queued" })));
    await expect(cyclogramApi.generate({
      organization: "",
      group_id: "middle",
      age: 3,
      group_name: "Балапан",
      teacher_name: "Алия",
      week_start: "2026-09-14",
      weekly_theme: "Күз",
      notes: "",
      language: "kk",
    })).rejects.toMatchObject({ code: "INVALID_RESPONSE", status: 200 });
  });

  it("keeps one idempotency key across safe transport retries", async () => {
    const fetchMock = vi.fn()
      .mockRejectedValueOnce(new TypeError("offline"))
      .mockResolvedValueOnce(accepted("cyclogram.topics"));
    vi.stubGlobal("fetch", fetchMock);
    const request = cyclogramApi.topics({ age: 3, group_id: "middle", language: "kk", week_start: "2026-09-14" });
    await expect(request).resolves.toMatchObject({ id: JOB_ID, kind: "cyclogram.topics" });
    const keys = fetchMock.mock.calls.map(([, init]) => new Headers((init as RequestInit).headers).get("Idempotency-Key"));
    expect(keys[0]).toBe(keys[1]);
  });
});
