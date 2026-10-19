import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiRequestError } from "@/lib/http-client";
import {
  attachPreschoolIntent,
  clearPreschoolIntentForJob,
  isPreschoolJobActive,
  preschoolIntent,
  preschoolJobFailureMessage,
  preschoolRequestFingerprint,
  restorePreschoolDraft,
  restorePreschoolPending,
  retryablePreschoolRequest,
  savePreschoolDraft,
  savePreschoolPending,
} from "./recovery";
import type { PreschoolActivityInput } from "./types";

const input: PreschoolActivityInput = {
  organization: "Garden", teacher_name: "Teacher", group_id: "middle", group_name: "Балапан", age: 3,
  activity_type: "speech", integrated_areas: [], topic: "Water", goal: "Explore", duration_minutes: 20,
  children_count: 18, group_count: 2, styles: ["mixed"], wow_enabled: true, story_character: "Drop",
  national_values: false, inclusive_enabled: false, support_needs: [], custom_support_need: "",
  teacher_script: true, expected_answers: true, output_format: "full", language: "en", notes: "Note",
};

describe("preschool recovery after interruption", () => {
  let storage: Map<string, string>;
  let owner: string;
  beforeEach(() => {
    owner = crypto.randomUUID();
    storage = new Map();
    vi.stubGlobal("window", {
      localStorage: { getItem: (key: string) => storage.get(key) ?? null, setItem: (key: string, value: string) => storage.set(key, value) },
    });
  });
  afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

  it("keeps the same paid intent across lost acknowledgements and object key reordering", () => {
    const first = preschoolRequestFingerprint("/generate", { topic: "Water", age: 3 });
    const second = preschoolRequestFingerprint("/generate", { age: 3, topic: "Water", optional: undefined });
    expect(first).toBe(second);
    const intent = preschoolIntent(owner, first);
    expect(preschoolIntent(owner, second).key).toBe(intent.key);
    expect(preschoolIntent(owner, preschoolRequestFingerprint("/generate", { topic: "Light", age: 3 })).key).not.toBe(intent.key);
  });

  it("isolates drafts, pending jobs and paid intents between accounts", () => {
    savePreschoolDraft(owner, input, "Autumn");
    savePreschoolPending(owner, { id: "30bdc3b2-41e6-4399-877c-cbab8e93a5d9", kind: "topics" });
    const intent = preschoolIntent(owner, "same-request");
    expect(restorePreschoolDraft("another-user")).toBeNull();
    expect(restorePreschoolPending("another-user")).toBeNull();
    expect(preschoolIntent("another-user", "same-request").key).not.toBe(intent.key);
    expect(restorePreschoolDraft(owner)).toMatchObject({ input, season: "Autumn" });
  });

  it("retains the original document and task when restoring a task update", () => {
    const pending = { id: "30bdc3b2-41e6-4399-877c-cbab8e93a5d9", kind: "task" as const, documentId: "document-1", taskId: "task-1" };
    savePreschoolPending(owner, pending);
    expect(restorePreschoolPending(owner)).toEqual(pending);
    savePreschoolPending(owner, null);
    expect(restorePreschoolPending(owner)).toBeNull();
  });

  it("allows an intentional new request after the completed job is observed", () => {
    const first = preschoolIntent(owner, "same-request");
    attachPreschoolIntent(owner, "same-request", "job-1");
    expect(preschoolIntent(owner, "same-request").jobId).toBe("job-1");
    clearPreschoolIntentForJob(owner, "unrelated-job");
    expect(preschoolIntent(owner, "same-request").key).toBe(first.key);
    clearPreschoolIntentForJob(owner, "job-1");
    expect(preschoolIntent(owner, "same-request").key).not.toBe(first.key);
  });

  it("expires stale restoration without reopening yesterday's work", () => {
    vi.useFakeTimers();
    savePreschoolDraft(owner, input, "Autumn");
    savePreschoolPending(owner, { id: "30bdc3b2-41e6-4399-877c-cbab8e93a5d9", kind: "generate" });
    const first = preschoolIntent(owner, "same-request");
    vi.advanceTimersByTime(24 * 60 * 60 * 1000 + 1);
    expect(restorePreschoolDraft(owner)).toBeNull();
    expect(restorePreschoolPending(owner)).toBeNull();
    expect(preschoolIntent(owner, "same-request").key).not.toBe(first.key);
  });

  it("keeps retry deduplication and drafts usable when browser storage throws", () => {
    vi.stubGlobal("window", { localStorage: { getItem: () => { throw new Error("disabled"); }, setItem: () => { throw new Error("quota"); } } });
    const first = preschoolIntent(owner, "same-request");
    expect(preschoolIntent(owner, "same-request").key).toBe(first.key);
    savePreschoolDraft(owner, input, "Autumn");
    expect(restorePreschoolDraft(owner)?.input.topic).toBe("Water");
  });

  it("ignores corrupted or incomplete storage instead of crashing the form", () => {
    storage.set(`sanduai_preschool_v1:${owner}:draft`, '{"input":{"topic":"Water"},"season":"","savedAt":' + Date.now() + "}");
    storage.set(`sanduai_preschool_v1:${owner}:pending`, "invalid json");
    expect(restorePreschoolDraft(owner)).toBeNull();
    expect(restorePreschoolPending(owner)).toBeNull();
  });

  it("recovers transport failures but stops polling permanently denied or missing jobs", () => {
    for (const status of [0, 408, 425, 429, 500, 503]) expect(retryablePreschoolRequest(new ApiRequestError("temporary", status))).toBe(true);
    for (const status of [400, 401, 402, 403, 404, 409, 422]) expect(retryablePreschoolRequest(new ApiRequestError("permanent", status))).toBe(false);
    expect(isPreschoolJobActive("refunding")).toBe(true);
    expect(isPreschoolJobActive("billing_error")).toBe(false);
  });

  it("explains quality failures and confirms refunds only after the server settled them", () => {
    expect(preschoolJobFailureMessage({ status: "failed", error_code: "INVALID_PROVIDER_OUTPUT", billing_status: "refunded" }, "ru"))
      .toBe("Не удалось подготовить материал нужного качества. Попробуйте создать его ещё раз. Монеты возвращены.");
    expect(preschoolJobFailureMessage({ status: "billing_error", error_code: "GENERATION_FAILED", billing_status: "error" }, "ru"))
      .not.toContain("Монеты возвращены");
    expect(preschoolJobFailureMessage({ status: "failed", error_code: "PROVIDER_RATE_LIMITED", billing_status: "refunded" }, "kk"))
      .toContain("жүктеме");
  });
});
