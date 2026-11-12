import { afterEach, describe, expect, it, vi } from "vitest";

const PROJECT = "182a6bdf-54c6-41c4-9fa2-fb98259441e7";
const PLAN = "44f9ce20-c082-4dc5-862c-5726ed57427a";
const JOB_A = "30bdc3b2-41e6-4399-877c-cbab8e93a5d9";
const JOB_B = "26b6f6ab-c065-4ff5-af81-12b1b20f3290";
const EXPORT_A = "6f8c1e31-1c5e-42cb-bb0d-61b7c177345c";
const EXPORT_B = "375c3cf5-b5b7-4ac5-9968-48db71b38e90";
const INTENTS = "sanduai_presentation_intents_v1";
const OWNER = "11111111-2222-4333-8444-555555555555";

function storage() {
  const values = new Map<string, string>();
  values.set("sanduai_token", `header.${Buffer.from(JSON.stringify({ sub: OWNER, exp: 4102444800 })).toString("base64url")}.signature`);
  const shared = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
    removeItem: (key: string) => { values.delete(key); },
  };
  vi.stubGlobal("window", { localStorage: shared });
  return { values, shared };
}
async function tab() { vi.resetModules(); return import("./presentations-api"); }
function job(id: string, kind: "export" | "generate" | "regenerate", status = "queued") {
  return { id, job_id: id, project_id: PROJECT, generation_id: PLAN, kind, status, progress: 0, progress_detail: {}, completed: 0, total: 0, message: null, cancel_requested: false, error_code: null, error_category: null, error_message: null, event_sequence: 0, created_at: "2026-11-12T00:00:00Z", updated_at: "2026-11-12T00:00:00Z" };
}
function json(value: unknown, status = 200) { return new Response(JSON.stringify(value), { status, headers: { "Content-Type": "application/json" } }); }
afterEach(() => { vi.unstubAllGlobals(); vi.resetModules(); });

describe("export mutation identity follows the acknowledged request", () => {
  it.each(["completed", "failed"])("uses a fresh request after an acknowledged %s export without polling its job", async previousStatus => {
    storage(); const api = await tab();
    const keys: string[] = []; let snapshot = "slide-v1";
    const accepted = new Map<string, object>();
    vi.stubGlobal("fetch", vi.fn(async (url, init: RequestInit) => {
      const path = new URL(String(url)).pathname;
      if (init.method === "PATCH") { snapshot = "slide-v2"; return json(job(JOB_B, "regenerate"), 202); }
      if (init.method === "POST") {
        const key = new Headers(init.headers).get("Idempotency-Key")!; keys.push(key);
        if (!accepted.has(key)) accepted.set(key, { export_id: accepted.size ? EXPORT_B : EXPORT_A, ...job(accepted.size ? JOB_B : JOB_A, "export") });
        return json(accepted.get(key), 202);
      }
      if (path === `/api/v2/presentations/${PROJECT}`) return json({
        id: PROJECT, title: "Edited deck", mode: "classic", status: "ready", language: "ru", created_at: "2026-11-12T00:00:00Z",
        read_only: false, source_missing: false, legacy_presenton_id: null, artifacts: [], active_plan: null,
        active_generation: { id: PLAN, status: "completed", total_slides: 1, completed_slides: 1, failed_slides: 0 },
        slides: [{ slide_key: "slide-1", order: 1, status: "ready", spec: { title: "Edited snapshot" }, active_version_id: "edited-slide-v2" }],
        latest_job: job(JOB_B, "regenerate", "completed"),
      });
      expect(path).toBe(`/api/v2/presentations/${PROJECT}/exports`);
      return json({ items: [{ id: EXPORT_A, format: "pptx", variant: "editable", status: previousStatus, download_url: previousStatus === "completed" ? `/api/v2/presentations/${PROJECT}/exports/${EXPORT_A}/download` : null, error_message: null, created_at: "2026-11-12T00:00:00Z" }] });
    }));
    const input = { format: "pptx", variant: "editable" } as const;
    await expect(api.createExport(PROJECT, input)).resolves.toMatchObject({ export_id: EXPORT_A, job_id: JOB_A, kind: "export" });
    await api.listExports(PROJECT);
    if (previousStatus === "completed") {
      await api.updateSlide(PROJECT, "slide-1", { title: "Edited snapshot" });
      await expect(api.getPresentation(PROJECT)).resolves.toMatchObject({ status: "ready", latest_job: { kind: "regenerate", status: "completed" } });
    }
    await expect(api.createExport(PROJECT, input)).resolves.toMatchObject({ export_id: EXPORT_B, job_id: JOB_B });
    expect(keys[1]).not.toBe(keys[0]);
    expect(snapshot).toBe(previousStatus === "completed" ? "slide-v2" : "slide-v1");
  });

  it("retains the same export identity for an ambiguous POST until its 202 is confirmed", async () => {
    storage(); const api = await tab(); const keys: Array<string | null> = [];
    vi.stubGlobal("fetch", vi.fn(async (_url, init: RequestInit) => {
      keys.push(new Headers(init.headers).get("Idempotency-Key"));
      if (keys.length === 1) throw new TypeError("acknowledgement lost after acceptance");
      return json({ export_id: keys.length < 3 ? EXPORT_A : EXPORT_B, ...job(keys.length < 3 ? JOB_A : JOB_B, "export") }, 202);
    }));
    const input = { format: "pptx", variant: "editable" } as const;
    await expect(api.createExport(PROJECT, input)).rejects.toMatchObject({ status: 0 });
    expect(keys).toHaveLength(1);
    await expect(api.createExport(PROJECT, input)).resolves.toMatchObject({ export_id: EXPORT_A });
    expect(keys[1]).toBe(keys[0]);
    await api.createExport(PROJECT, input);
    expect(keys[2]).not.toBe(keys[1]);
  });

  it.each([200, 202])("does not retire an export key after an invalid HTTP %i acknowledgement", async status => {
    storage(); const api = await tab(); const keys: Array<string | null> = [];
    vi.stubGlobal("fetch", vi.fn(async (_url, init: RequestInit) => {
      keys.push(new Headers(init.headers).get("Idempotency-Key"));
      if (keys.length === 1) return json(status === 200 ? { export_id: EXPORT_A, ...job(JOB_A, "export") } : { export_id: EXPORT_A }, status);
      return json({ export_id: EXPORT_A, ...job(JOB_A, "export") }, 202);
    }));
    const input = { format: "pptx", variant: "editable" } as const;
    await expect(api.createExport(PROJECT, input)).rejects.toMatchObject({ code: "INVALID_RESPONSE" });
    await api.createExport(PROJECT, input);
    expect(keys[1]).toBe(keys[0]);
  });
});

describe("separate tab modules share authoritative persisted identity", () => {
  it("does not resurrect tab A memory after tab B confirms the terminal job", async () => {
    const { values } = storage(); const a = await tab(); const keys: string[] = [];
    vi.stubGlobal("fetch", vi.fn(async (_url, init: RequestInit) => {
      if (init.method !== "POST") return json(job(JOB_A, "generate", "completed"));
      const key = new Headers(init.headers).get("Idempotency-Key")!; keys.push(key);
      return json(job(keys.length === 1 || key === keys[0] ? JOB_A : JOB_B, "generate"), 202);
    }));
    await a.startGeneration(PROJECT, PLAN);
    const b = await tab(); await b.getJob(JOB_A);
    expect(JSON.parse(values.get(INTENTS) ?? "{}")).toEqual({});
    await expect(a.startGeneration(PROJECT, PLAN)).resolves.toMatchObject({ job_id: JOB_B });
    expect(keys[1]).not.toBe(keys[0]);
  });

  it("does not let a stale terminal read delete another tab's newer live identity", async () => {
    const { values, shared } = storage(); const a = await tab(); let next = JOB_A;
    vi.stubGlobal("fetch", vi.fn(async (_url, init: RequestInit) => json(job(init.method === "POST" ? next : JOB_A, "generate", init.method === "POST" ? "queued" : "completed"), init.method === "POST" ? 202 : 200)));
    await a.startGeneration(PROJECT, PLAN); const oldRaw = values.get(INTENTS)!;
    values.set(INTENTS, "{}"); next = JOB_B; const b = await tab(); await b.startGeneration(PROJECT, PLAN);
    const newRaw = values.get(INTENTS)!; values.set(INTENTS, oldRaw);
    const normalRead = shared.getItem;
    let interleaved = false;
    shared.getItem = key => {
      const raw = normalRead(key);
      if (key === INTENTS && !interleaved) { interleaved = true; values.set(INTENTS, newRaw); }
      return raw;
    };
    await a.getJob(JOB_A);
    expect(values.get(INTENTS)).toBe(newRaw);
    expect(Object.values(JSON.parse(values.get(INTENTS)!))).toEqual([expect.objectContaining({ jobId: JOB_B })]);
  });

  it("uses memory for the same ambiguous write only when storage really cannot be read", async () => {
    const { shared } = storage(); const normalRead = shared.getItem;
    shared.getItem = key => { if (key === INTENTS) throw new Error("storage blocked"); return normalRead(key); };
    const a = await tab(); const keys: Array<string | null> = [];
    vi.stubGlobal("fetch", vi.fn(async (_url, init: RequestInit) => { keys.push(new Headers(init.headers).get("Idempotency-Key")); if (keys.length === 1) throw new TypeError("lost acknowledgement"); return json(job(JOB_A, "generate"), 202); }));
    await expect(a.startGeneration(PROJECT, PLAN)).rejects.toMatchObject({ status: 0 });
    await a.startGeneration(PROJECT, PLAN); expect(keys[1]).toBe(keys[0]);
  });

  it("does not dispatch a new write if readable storage cannot save its recovery identity", async () => {
    const { shared } = storage();
    shared.setItem = () => { throw new Error("storage full"); };
    const a = await tab();
    const network = vi.fn(async () => json(job(JOB_A, "generate"), 202)); vi.stubGlobal("fetch", network);
    await expect(a.startGeneration(PROJECT, PLAN)).rejects.toMatchObject({ status: 0 });
    expect(network).not.toHaveBeenCalled();
  });
});
