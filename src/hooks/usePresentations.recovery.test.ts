// @vitest-environment happy-dom
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { QueryClient, QueryClientProvider, onlineManager } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { presentationKeys, useJob, useJobEventStream } from "./usePresentations";

const JOB = "30bdc3b2-41e6-4399-877c-cbab8e93a5d9";
let root: Root;
let host: HTMLDivElement;
let cache: QueryClient;
let calls: Array<{ path: string; method: string }>;
let status: string;
let unavailable: boolean;
function Probe() {
  const job = useJob(JOB);
  return createElement("div", null,
    createElement("p", { role: "status" }, job.error ? "read unavailable" : job.data?.status),
    createElement("button", { onClick: () => void job.refetch() }, "Resume existing job"),
  );
}
function StreamProbe() {
  useJobEventStream(JOB);
  return createElement("div", null, "Stored job stream");
}
async function advance(ms = 0) { await act(async () => { await vi.advanceTimersByTimeAsync(ms); }); }
async function mount() {
  await act(async () => root.render(createElement(QueryClientProvider, { client: cache }, createElement(Probe))));
  await advance();
}
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  vi.useFakeTimers(); onlineManager.setOnline(true);
  calls = []; status = "running"; unavailable = false;
  cache = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity } } });
  host = document.createElement("div"); document.body.append(host); root = createRoot(host);
  vi.stubGlobal("fetch", vi.fn(async (url, init: RequestInit) => {
    calls.push({ path: new URL(String(url)).pathname, method: init.method ?? "GET" });
    return unavailable
      ? new Response(JSON.stringify({ detail: "temporary status outage" }), { status: 503 })
      : new Response(JSON.stringify({ id: JOB, kind: "generate", status }), { headers: { "Content-Type": "application/json" } });
  }));
});
afterEach(async () => {
  await act(async () => root.unmount()); cache.clear(); host.remove();
  onlineManager.setOnline(true); vi.useRealTimers(); vi.unstubAllGlobals();
});

describe("accepted presentation job recovery", () => {
  it("does not replace a completed GET result with a delayed active SSE event", async () => {
    cache.setQueryData(presentationKeys.job(JOB), { id: JOB, kind: "generate", status: "completed", completed: 4, total: 4 });
    vi.stubGlobal("fetch", vi.fn(async (url, init: RequestInit) => {
      calls.push({ path: new URL(String(url)).pathname, method: init.method ?? "GET" });
      return new Response('id: 1\nevent: job.progress\ndata: {"status":"queued","completed":0}\n\n', { headers: { "Content-Type": "text/event-stream" } });
    }));
    await act(async () => root.render(createElement(QueryClientProvider, { client: cache }, createElement(StreamProbe)))); await advance();
    expect(cache.getQueryData(presentationKeys.job(JOB))).toMatchObject({ status: "completed", completed: 4 });
    expect(calls).toEqual([{ path: `/api/v2/jobs/${JOB}/events`, method: "GET" }]);
  });

  it("reconnects from first status 503 to completed with GET only", async () => {
    unavailable = true; await mount(); expect(host.textContent).toContain("read unavailable");
    await act(async () => onlineManager.setOnline(false));
    unavailable = false; status = "completed";
    await act(async () => onlineManager.setOnline(true)); await advance();
    expect(host.textContent).toContain("completed");
    expect(calls).toEqual([{ path: `/api/v2/jobs/${JOB}`, method: "GET" }, { path: `/api/v2/jobs/${JOB}`, method: "GET" }]);
    await advance(120000); expect(calls).toHaveLength(2);
  });

  it("bounds repeated failed reads and allows resuming the same job", async () => {
    cache.setQueryData(presentationKeys.job(JOB), { id: JOB, status: "running" });
    unavailable = true; await mount();
    await advance(180000);
    expect(calls).toHaveLength(5);
    expect(cache.getQueryData(presentationKeys.job(JOB))).toMatchObject({ id: JOB, status: "running" });
    unavailable = false; status = "completed";
    await act(async () => host.querySelector("button")!.click()); await advance();
    expect(host.textContent).toContain("completed");
    expect(calls).toHaveLength(6);
    expect(calls.every(call => call.method === "GET" && call.path.endsWith(JOB))).toBe(true);
  });

  it.each(["completed_with_errors", "partial_failed", "expired", "queue_expired", "failed", "cancelled"])("stops reads for terminal %s", async terminal => {
    status = terminal; await mount(); await advance(120000);
    expect(calls).toHaveLength(1);
    expect(host.textContent).toContain(terminal);
  });
});
