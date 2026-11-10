import { afterEach, describe, expect, it, vi } from "vitest";
import { generationConnection, generationJobPollingInterval, generationPollingInterval, isGenerationJobBusy, startGenerationPolling } from "./generation-polling";

const state = (data?: { status: string }, error: unknown = null, failures = 0) => ({ data, error, fetchFailureCount: failures });
afterEach(() => vi.useRealTimers());
describe("resilient generation polling", () => {
  it("polls before the first successful response and backs off transient failures with a cap", () => {
    expect(generationJobPollingInterval({ state: state() })).toBe(2000);
    expect(generationPollingInterval(state(undefined, { status: 503 }, 1), false)).toBe(4000);
    expect(generationPollingInterval(state(undefined, { status: 429 }, 4), false)).toBe(30000);
    expect(generationPollingInterval(state(undefined, new Error("offline"), 99), false)).toBe(30000);
    expect(generationJobPollingInterval({ state: state({ status: "running" }) })).toBe(2000);
    expect(generationJobPollingInterval({ state: state({ status: "completed" }) })).toBe(false);
  });
  it.each([401, 403, 404, 410])("stops on %i even when cached job is active", status => {
    const query = { state: state({ status: "running" }, { status }, 1) };
    expect(generationJobPollingInterval(query)).toBe(false);
    expect(isGenerationJobBusy({ data: query.state.data, error: { status }, isPending: false })).toBe(false);
    expect(generationConnection({ status })).toBe(status < 404 ? "credentials" : "unavailable");
  });
  it("keeps last job data separate from disconnected state", () => {
    const job = { status: "running" };
    expect(generationConnection(new Error("offline"))).toBe("reconnecting");
    expect(isGenerationJobBusy({ data: job, error: new Error("offline"), isPending: false })).toBe(false);
    expect(job.status).toBe("running");
    expect(generationConnection(null)).toBe("connected");
  });
  it("recovers through repeated transport errors, then completes without discarding data", async () => {
    vi.useFakeTimers();
    let attempt = 0;
    const statuses: string[] = [];
    const errors: unknown[] = [];
    const poller = startGenerationPolling({
      read: async () => { attempt++; if (attempt === 2 || attempt === 3) throw { status: 503 }; return { status: attempt === 4 ? "completed" : "running" }; },
      onData: job => { statuses.push(job.status); }, onError: error => { errors.push(error); },
    });
    await vi.advanceTimersByTimeAsync(0);
    expect(statuses).toEqual(["running"]);
    await vi.advanceTimersByTimeAsync(2000);
    expect(errors).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(4000);
    expect(errors).toHaveLength(2);
    await vi.advanceTimersByTimeAsync(8000);
    expect(statuses).toEqual(["running", "completed"]);
    await vi.advanceTimersByTimeAsync(60000);
    expect(attempt).toBe(4);
    poller.stop();
  });
  it("supports immediate reconnect/manual retry, prevents overlap and ignores stopped responses", async () => {
    vi.useFakeTimers();
    let resolve!: (job: { status: string }) => void;
    let calls = 0; const statuses: string[] = [];
    const poller = startGenerationPolling({ read: () => { calls++; return new Promise<{ status: string }>(done => { resolve = done; }); }, onData: job => { statuses.push(job.status); }, onError: () => {} });
    poller.retry(); poller.retry();
    expect(calls).toBe(1);
    resolve({ status: "running" }); await vi.advanceTimersByTimeAsync(0);
    poller.retry(); expect(calls).toBe(2);
    poller.stop(); resolve({ status: "completed" }); await vi.advanceTimersByTimeAsync(30000);
    expect(statuses).toEqual(["running"]);
  });
  it("does not automatically retry permanent errors but allows a manual recovery check", async () => {
    vi.useFakeTimers(); let calls = 0; const statuses: string[] = [];
    const poller = startGenerationPolling({ read: async () => { if (++calls === 1) throw { status: 404 }; return { status: "completed" }; }, onData: job => { statuses.push(job.status); }, onError: () => {} });
    await vi.advanceTimersByTimeAsync(60000); expect(calls).toBe(1);
    poller.retry(); await vi.advanceTimersByTimeAsync(0); expect(statuses).toEqual(["completed"]);
    poller.stop();
  });
});

it("increases query backoff across separate fetches and resets after a successful response", () => {
  const owner = {};
  const failed = (errorUpdateCount: number, dataUpdatedAt = 0) => ({ error: { status: 503 }, fetchFailureCount: 1, errorUpdateCount, dataUpdatedAt });
  expect(generationPollingInterval(failed(1), false, owner)).toBe(4000);
  expect(generationPollingInterval(failed(2), false, owner)).toBe(8000);
  expect(generationPollingInterval(failed(2), false, owner)).toBe(8000);
  expect(generationPollingInterval({ error: null, fetchFailureCount: 0, errorUpdateCount: 2, dataUpdatedAt: 10 }, 2000, owner)).toBe(2000);
  expect(generationPollingInterval(failed(3, 10), false, owner)).toBe(4000);
});

it("tracks the real TanStack query across failed fetches without clearing its completed result", async () => {
  const { QueryClient } = await import("@tanstack/react-query");
  const cache = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const key = ["poll-runtime-integration", "owner-a"];
  const stored = { status: "completed", result: { title: "Сохранённый материал" } };
  cache.setQueryData(key, stored);
  const query = cache.getQueryCache().find({ queryKey: key })!;
  const fail = () => cache.fetchQuery({ queryKey: key, queryFn: async () => { throw { status: 503 }; }, staleTime: 0 });
  await expect(fail()).rejects.toEqual({ status: 503 });
  expect(generationJobPollingInterval(query as Parameters<typeof generationJobPollingInterval>[0])).toBe(4000);
  await expect(fail()).rejects.toEqual({ status: 503 });
  expect(generationJobPollingInterval(query as Parameters<typeof generationJobPollingInterval>[0])).toBe(8000);
  expect(cache.getQueryData(key)).toEqual(stored);
  await cache.fetchQuery({ queryKey: key, queryFn: async () => stored, staleTime: 0 });
  expect(generationJobPollingInterval(query as Parameters<typeof generationJobPollingInterval>[0])).toBe(false);
  cache.clear();
});

it.each(["online", "focus", "sanduai:retry-generation-polls"])("recovers immediately on the browser %s signal and removes listeners on stop", async signal => {
  vi.useFakeTimers();
  const browser = new EventTarget(); const page = new EventTarget();
  Object.defineProperty(page, "visibilityState", { value: "visible" });
  vi.stubGlobal("window", browser); vi.stubGlobal("document", page);
  let calls = 0; const statuses: string[] = [];
  const poller = startGenerationPolling({ read: async () => { if (++calls === 1) throw { status: 503 }; return { status: "running" }; }, onData: job => { statuses.push(job.status); }, onError: () => {} });
  await vi.advanceTimersByTimeAsync(0); expect(calls).toBe(1);
  browser.dispatchEvent(new Event(signal)); await vi.advanceTimersByTimeAsync(0);
  expect(statuses).toEqual(["running"]); expect(calls).toBe(2);
  poller.stop(); browser.dispatchEvent(new Event(signal)); await vi.advanceTimersByTimeAsync(60000); expect(calls).toBe(2);
  vi.unstubAllGlobals();
});

it("waits for asynchronous completion reconciliation before deciding whether to continue", async () => {
  vi.useFakeTimers(); let calls = 0; let installed = false;
  const poller = startGenerationPolling({ read: async () => { calls++; return { status: "completed" }; }, onData: async () => { await Promise.resolve(); if (calls === 1) return true; installed = true; return false; }, onError: () => {} });
  await vi.advanceTimersByTimeAsync(0); expect(calls).toBe(1); expect(installed).toBe(false);
  await vi.advanceTimersByTimeAsync(2000); expect(calls).toBe(2); expect(installed).toBe(true);
  await vi.advanceTimersByTimeAsync(60000); expect(calls).toBe(2); poller.stop();
});
