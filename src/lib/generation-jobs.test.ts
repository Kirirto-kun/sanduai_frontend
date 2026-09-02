import { afterEach, describe, expect, it, vi } from "vitest";

import { listGenerationJobs, waitForGenerationResult } from "./api";


function response(value: unknown): Response {
  return new Response(JSON.stringify(value), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}


describe("durable generation results", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns a saved material even when its ledger needs reconciliation", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response({
      id: "job-1",
      status: "billing_error",
      result: { title: "Сақталған материал" },
    })));

    await expect(waitForGenerationResult<{ title: string }>("job-1")).resolves.toEqual({
      title: "Сақталған материал",
    });
  });

  it("does not poll forever when reconciliation has no usable result", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response({
      id: "job-2",
      status: "billing_error",
      result: null,
      error_code: "BILLING_RESERVATION_MISSING",
    })));

    await expect(waitForGenerationResult("job-2")).rejects.toMatchObject({
      status: 502,
    });
  });

  it("passes offset and limit while accepting the current list response", async () => {
    const fetchMock = vi.fn().mockResolvedValue(response({
      items: [],
      active_count: 0,
      server_time: "2026-08-31T00:00:00Z",
    }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(listGenerationJobs({ limit: 25, offset: 50 })).resolves.toMatchObject({
      items: [],
      active_count: 0,
    });

    const requestUrl = new URL(String(fetchMock.mock.calls[0]?.[0]));
    expect(requestUrl.searchParams.get("limit")).toBe("25");
    expect(requestUrl.searchParams.get("offset")).toBe("50");
  });

  it("passes server-side module and status filters", async () => {
    const fetchMock = vi.fn().mockResolvedValue(response({
      items: [],
      active_count: 0,
      server_time: "2026-09-01T00:00:00Z",
    }));
    vi.stubGlobal("fetch", fetchMock);

    await listGenerationJobs({
      limit: 6,
      kind: "kmzh.generate",
      status: "completed",
    });

    const requestUrl = new URL(String(fetchMock.mock.calls[0]?.[0]));
    expect(requestUrl.searchParams.get("kind")).toBe("kmzh.generate");
    expect(requestUrl.searchParams.get("status")).toBe("completed");
  });

  it("keeps the previous numeric limit call compatible", async () => {
    const fetchMock = vi.fn().mockResolvedValue(response({
      items: [],
      active_count: 0,
      server_time: "2026-08-31T00:00:00Z",
    }));
    vi.stubGlobal("fetch", fetchMock);

    await listGenerationJobs(12);

    const requestUrl = new URL(String(fetchMock.mock.calls[0]?.[0]));
    expect(requestUrl.searchParams.get("limit")).toBe("12");
    expect(requestUrl.searchParams.get("offset")).toBe("0");
  });
});
