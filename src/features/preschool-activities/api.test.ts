import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { GenerationJob } from "@/lib/api";
import { ApiRequestError } from "@/lib/http-client";
import type { PreschoolActivityInput } from "./types";

const mocked = vi.hoisted(() => ({ request: vi.fn(), owner: "", updates: vi.fn() }));
vi.mock("@/lib/api", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/lib/api")>(),
  getToken: () => `eyJhbGciOiJIUzI1NiJ9.${btoa(JSON.stringify({ sub: mocked.owner })).replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_")}.c2lnbmF0dXJl`,
  getUser: () => ({ userId: mocked.owner }),
}));
vi.mock("@/lib/http-client", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/lib/http-client")>(), requestJson: mocked.request,
}));
import { preschoolActivityApi } from "./api";

const JOB_ID = "30bdc3b2-41e6-4399-877c-cbab8e93a5d9";
const queued = (kind = "preschool_activity.generate", status = "queued") => ({ id: JOB_ID, kind, status, result: null }) as GenerationJob;
const input: PreschoolActivityInput = {
  organization: "Garden", teacher_name: "Teacher", group_id: "middle", group_name: "Балапан", age: 3,
  activity_type: "speech", integrated_areas: [], topic: "Water", goal: "Explore", duration_minutes: 20,
  children_count: 18, group_count: 2, styles: ["mixed"], wow_enabled: true, story_character: "Drop",
  national_values: false, inclusive_enabled: false, support_needs: [], custom_support_need: "",
  teacher_script: true, expected_answers: true, output_format: "full", language: "en", notes: "Note",
};
function keys(): Array<string | null> {
  return mocked.request.mock.calls.filter(([, init]) => init.method === "POST")
    .map(([, init]) => new Headers(init.headers).get("Idempotency-Key"));
}

describe("preschool paid request recovery", () => {
  beforeEach(() => {
    mocked.owner = crypto.randomUUID();
    mocked.request.mockReset();
    const storage = new Map<string, string>();
    vi.stubGlobal("window", { localStorage: { getItem: (key: string) => storage.get(key) ?? null, setItem: (key: string, value: string) => storage.set(key, value), removeItem: (key: string) => storage.delete(key) }, dispatchEvent: mocked.updates });
  });
  afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

  it("reuses the original payment key when the user retries after every acknowledgement was lost", async () => {
    vi.useFakeTimers();
    mocked.request.mockRejectedValue(new ApiRequestError("offline", 0));
    const first = preschoolActivityApi.generate(input);
    const failure = expect(first).rejects.toMatchObject({ status: 0 });
    await vi.runAllTimersAsync();
    await failure;
    expect(mocked.request).toHaveBeenCalledTimes(3);
    mocked.request.mockResolvedValue(queued());
    await expect(preschoolActivityApi.generate(input)).resolves.toMatchObject({ id: JOB_ID });
    expect(new Set(keys()).size).toBe(1);
  });

  it("deduplicates simultaneous submissions of the same paid action", async () => {
    let acknowledge!: (job: GenerationJob) => void;
    mocked.request.mockImplementation(() => new Promise<GenerationJob>((resolve) => { acknowledge = resolve; }));
    const first = preschoolActivityApi.generate(input);
    const second = preschoolActivityApi.generate({ ...input });
    expect(mocked.request).toHaveBeenCalledTimes(1);
    acknowledge(queued());
    await expect(Promise.all([first, second])).resolves.toHaveLength(2);
  });

  it("reattaches to an acknowledged running job and creates a new action after completion", async () => {
    mocked.request.mockResolvedValueOnce(queued());
    await preschoolActivityApi.generate(input);
    mocked.request.mockResolvedValueOnce(queued("preschool_activity.generate", "running"));
    await expect(preschoolActivityApi.generate(input)).resolves.toMatchObject({ status: "running" });
    expect(keys()).toHaveLength(1);
    mocked.request.mockResolvedValueOnce(queued("preschool_activity.generate", "completed"));
    await preschoolActivityApi.job(JOB_ID);
    mocked.request.mockResolvedValueOnce(queued());
    await preschoolActivityApi.generate(input);
    expect(keys()).toHaveLength(2);
    expect(keys()[0]).not.toBe(keys()[1]);
  });

  it("does not share payment keys across accounts", async () => {
    mocked.request.mockResolvedValue(queued());
    await preschoolActivityApi.generate(input);
    mocked.owner = crypto.randomUUID();
    await preschoolActivityApi.generate(input);
    expect(keys()[0]).not.toBe(keys()[1]);
  });

  it("stops immediate validation errors and lets a corrected request use a new key", async () => {
    mocked.request.mockRejectedValueOnce(new ApiRequestError("invalid", 422));
    await expect(preschoolActivityApi.generate(input)).rejects.toMatchObject({ status: 422 });
    mocked.request.mockResolvedValueOnce(queued());
    await preschoolActivityApi.generate(input);
    expect(keys()[0]).not.toBe(keys()[1]);
  });

  it("rejects an acknowledgement for a different feature before showing a result", async () => {
    vi.useFakeTimers();
    mocked.request.mockResolvedValue(queued("cyclogram.generate"));
    const assertion = expect(preschoolActivityApi.generate(input)).rejects.toMatchObject({ code: "INVALID_RESPONSE" });
    await vi.runAllTimersAsync();
    await assertion;
    expect(new Set(keys()).size).toBe(1);
  });

  it("attaches a valid paid acknowledgement even when browser storage is blocked", async () => {
    vi.stubGlobal("window", {
      get localStorage() { throw new Error("Storage is disabled"); },
      dispatchEvent: mocked.updates,
    });
    mocked.request.mockResolvedValue(queued());
    await expect(preschoolActivityApi.generate(input)).resolves.toMatchObject({ id: JOB_ID, status: "queued" });
    mocked.request.mockResolvedValueOnce(queued("preschool_activity.generate", "running"));
    await expect(preschoolActivityApi.generate(input)).resolves.toMatchObject({ status: "running" });
    expect(keys()).toHaveLength(1);
  });

  it("does not retry a lost paid request using a different account's token", async () => {
    vi.useFakeTimers();
    mocked.request.mockRejectedValueOnce(new ApiRequestError("offline", 0));
    const request = preschoolActivityApi.generate(input);
    const failure = expect(request).rejects.toMatchObject({ status: 403, details: { detail: { code: "AUTH_SESSION_CHANGED" } } });
    await vi.advanceTimersByTimeAsync(0);
    mocked.owner = crypto.randomUUID();
    await vi.runAllTimersAsync();
    await failure;
    expect(keys()).toHaveLength(1);
  });

  it("rejects a late acknowledgement after the account changes", async () => {
    let acknowledge!: (job: GenerationJob) => void;
    mocked.request.mockImplementation(() => new Promise<GenerationJob>((resolve) => { acknowledge = resolve; }));
    const request = preschoolActivityApi.generate(input);
    mocked.owner = crypto.randomUUID();
    acknowledge(queued());
    await expect(request).rejects.toMatchObject({ status: 403, details: { detail: { code: "AUTH_SESSION_CHANGED" } } });
  });

  it("does not show an earlier account's result after a late polling response", async () => {
    let acknowledge!: (job: GenerationJob) => void;
    mocked.request.mockImplementation(() => new Promise<GenerationJob>((resolve) => { acknowledge = resolve; }));
    const request = preschoolActivityApi.job(JOB_ID);
    mocked.owner = crypto.randomUUID();
    acknowledge(queued("preschool_activity.generate", "completed"));
    await expect(request).rejects.toMatchObject({ status: 403, details: { detail: { code: "AUTH_SESSION_CHANGED" } } });
  });
});
