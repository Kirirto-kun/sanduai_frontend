import { afterEach, describe, expect, it, vi } from "vitest";

import { builderApi } from "./api";

function jsonResponse(contentLanguage: string): Response {
  return new Response(JSON.stringify({ id: "project-1", content_language: contentLanguage }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

describe("Builder language API contract", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("persists explicit content language on create and update", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse("ky"))
      .mockResolvedValueOnce(jsonResponse("uz"));
    vi.stubGlobal("fetch", fetchMock);

    await builderApi.create({
      title: "Оюн",
      description: "Балдар үчүн оюн",
      project_type: "game",
      content_language: "ky",
    });
    await builderApi.update("project-1", { content_language: "uz" });

    expect(JSON.parse(String((fetchMock.mock.calls[0]?.[1] as RequestInit).body))).toMatchObject({
      project_type: "game",
      content_language: "ky",
    });
    expect(JSON.parse(String((fetchMock.mock.calls[1]?.[1] as RequestInit).body))).toEqual({
      content_language: "uz",
    });
    expect((fetchMock.mock.calls[0]?.[1] as RequestInit).method).toBe("POST");
    expect((fetchMock.mock.calls[1]?.[1] as RequestInit).method).toBe("PATCH");
  });
});

describe("Builder durable generation API contract", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("accepts only a durable builder.build acknowledgement and reuses the supplied key", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      id: "8870e28b-77b2-4381-ae91-84c2247a0001",
      kind: "builder.build",
      resource_id: "5cb79bda-6e62-4f7f-a4b7-46cbc7a70001",
      status: "queued",
      title: "Builder",
      source_path: "/dashboard/ai/builder?project=5cb79bda-6e62-4f7f-a4b7-46cbc7a70001",
      progress: {},
      cost_tokens: 50,
      captured_tokens: 0,
      billing_status: "reserved",
      attempt_count: 0,
      cancel_requested: false,
      error_code: null,
      error_message: null,
      created_at: "2026-09-22T00:00:00Z",
      updated_at: "2026-09-22T00:00:00Z",
      started_at: null,
      completed_at: null,
      expires_at: null,
      result: null,
      artifact_urls: [],
    }), { status: 202, headers: { "Content-Type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);

    const job = await builderApi.build("5cb79bda-6e62-4f7f-a4b7-46cbc7a70001", {
      prompt: "Создай игру",
      expected_version: 0,
      expected_revision: 1,
      asset_ids: [],
      mode: "generate",
      max_cost: 50,
    }, "builder-fixed-idempotency-key");

    expect(job).toMatchObject({
      id: "8870e28b-77b2-4381-ae91-84c2247a0001",
      kind: "builder.build",
      status: "queued",
    });
    const request = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(new Headers(request.headers).get("Idempotency-Key"))
      .toBe("builder-fixed-idempotency-key");
  });

  it("rejects a synchronous project-shaped response so progress cannot be lost", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse("ru")));

    await expect(builderApi.build("5cb79bda-6e62-4f7f-a4b7-46cbc7a70001", {
      prompt: "Создай игру",
      expected_version: 0,
      asset_ids: [],
      mode: "generate",
    }, "builder-fixed-idempotency-key")).rejects.toMatchObject({
      code: "INVALID_RESPONSE",
    });
  });

  it("loads the latest project job for refresh reconciliation", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      id: "8870e28b-77b2-4381-ae91-84c2247a0001",
      kind: "builder.build",
      resource_id: "5cb79bda-6e62-4f7f-a4b7-46cbc7a70001",
      status: "completed",
      title: "Builder",
      source_path: "/dashboard/ai/builder?project=5cb79bda-6e62-4f7f-a4b7-46cbc7a70001",
      progress: { current: 1, total: 1 },
      cost_tokens: 50,
      captured_tokens: 50,
      billing_status: "captured",
      attempt_count: 1,
      cancel_requested: false,
      error_code: null,
      error_message: null,
      created_at: "2026-09-22T00:00:00Z",
      updated_at: "2026-09-22T00:01:00Z",
      started_at: "2026-09-22T00:00:01Z",
      completed_at: "2026-09-22T00:01:00Z",
      expires_at: null,
      result: {
        project_id: "5cb79bda-6e62-4f7f-a4b7-46cbc7a70001",
        current_version: 1,
        revision: 2,
      },
      artifact_urls: [],
    }), { status: 200, headers: { "Content-Type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);

    const job = await builderApi.latestBuild(
      "5cb79bda-6e62-4f7f-a4b7-46cbc7a70001",
      false,
    );

    expect(job).toMatchObject({ status: "completed", resource_id: "5cb79bda-6e62-4f7f-a4b7-46cbc7a70001" });
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain("/build/latest?active_only=false");
  });

  it("checks the exact idempotency key before a lost acknowledgement is replayed", async () => {
    const projectId = "5cb79bda-6e62-4f7f-a4b7-46cbc7a70001";
    const payload = {
      prompt: "Создай игру",
      expected_version: 0,
      expected_revision: 1,
      asset_ids: [],
      mode: "generate" as const,
      max_cost: 50,
    };
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      status: "succeeded",
      project: { id: projectId, content_language: "ru", current_version: 1 },
    }), { status: 200, headers: { "Content-Type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await builderApi.buildStatus(
      projectId,
      payload,
      "builder-lost-ack-idempotency-key",
    );

    expect(result.status).toBe("succeeded");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain(`/projects/${projectId}/build/status`);
    const request = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(new Headers(request.headers).get("Idempotency-Key"))
      .toBe("builder-lost-ack-idempotency-key");
    expect(JSON.parse(String(request.body))).toEqual(payload);
  });

  it("rejects a Builder job bound to another project", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
      id: "8870e28b-77b2-4381-ae91-84c2247a0001",
      kind: "builder.build",
      resource_id: "5cb79bda-6e62-4f7f-a4b7-46cbc7a70002",
      status: "queued",
    }), { status: 202, headers: { "Content-Type": "application/json" } })));

    await expect(builderApi.build("5cb79bda-6e62-4f7f-a4b7-46cbc7a70001", {
      prompt: "Создай игру",
      expected_version: 0,
      asset_ids: [],
      mode: "generate",
    }, "builder-fixed-idempotency-key")).rejects.toMatchObject({
      code: "INVALID_RESPONSE",
    });
  });
});
