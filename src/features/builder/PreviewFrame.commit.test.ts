import { isValidElement, type ReactElement, type ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import PreviewFrame from "./PreviewFrame";
import type { BuilderAsset } from "./types";

type Slot = { value?: unknown; deps?: readonly unknown[]; cleanup?: () => void };
const hooks = vi.hoisted(() => ({ slots: [] as Slot[], cursor: 0, layout: [] as (() => void)[], passive: [] as (() => void)[] }));
vi.mock("react", async importOriginal => {
  const actual = await importOriginal<typeof import("react")>();
  const slot = () => { const index = hooks.cursor++; return hooks.slots[index] ?? (hooks.slots[index] = {}); };
  const changed = (entry: Slot, deps: readonly unknown[]) => !entry.deps || deps.some((value, i) => !Object.is(value, entry.deps?.[i])) || deps.length !== entry.deps.length;
  const memo = (create: () => unknown, deps: readonly unknown[]) => { const entry = slot(); if (changed(entry, deps)) { entry.value = create(); entry.deps = deps; } return entry.value; };
  const effect = (create: () => void | (() => void), deps: readonly unknown[], phase: "layout" | "passive") => {
    const entry = slot(); if (changed(entry, deps)) { entry.deps = deps; hooks[phase].push(() => { entry.cleanup?.(); entry.cleanup = create() || undefined; }); }
  };
  return { ...actual,
    useRef: (value: unknown) => { const entry = slot(); if (!entry.value) entry.value = { current: value }; return entry.value; },
    useState: (initial: unknown) => { const entry = slot(); if (!("value" in entry)) entry.value = typeof initial === "function" ? (initial as () => unknown)() : initial; return [entry.value, (value: unknown) => { entry.value = typeof value === "function" ? (value as (old: unknown) => unknown)(entry.value) : value; }]; },
    useMemo: memo, useCallback: (value: unknown, deps: readonly unknown[]) => memo(() => value, deps),
    useEffect: (create: () => void | (() => void), deps: readonly unknown[]) => effect(create, deps, "passive"),
    useLayoutEffect: (create: () => void | (() => void), deps: readonly unknown[]) => effect(create, deps, "layout"),
  };
});
vi.mock("@/lib/api-base", () => ({ getApiBase: () => "https://api.example.invalid" }));

function frameRef(node: ReactNode): { current: unknown } | undefined {
  if (Array.isArray(node)) return node.map(frameRef).find(Boolean);
  if (!isValidElement(node)) return undefined;
  const element = node as ReactElement<{ ref?: { current: unknown }; children?: ReactNode }>;
  return element.type === "iframe" ? element.props.ref : frameRef(element.props.children);
}
function commit(phase: "layout" | "passive") { for (const callback of hooks[phase].splice(0)) callback(); }
beforeEach(() => { hooks.slots = []; hooks.cursor = 0; hooks.layout = []; hooks.passive = []; });
afterEach(() => { for (const entry of hooks.slots) entry.cleanup?.(); vi.unstubAllGlobals(); });

describe("PreviewFrame committed message capabilities", () => {
  it("publishes replacement allowlists/callbacks only at layout commit and preserves source/channel/cleanup guards", async () => {
    const listeners = new Map<string, (event: MessageEvent) => void>();
    const add = vi.fn((type: string, callback: (event: MessageEvent) => void) => listeners.set(type, callback));
    const remove = vi.fn((type: string) => listeners.delete(type));
    vi.stubGlobal("window", { addEventListener: add, removeEventListener: remove, setTimeout, clearTimeout });
    vi.stubGlobal("document", { addEventListener: vi.fn(), removeEventListener: vi.fn(), hidden: false });
    const fetch = vi.fn().mockResolvedValue(new Response(new Blob(["owned fixture"], { type: "image/png" })));
    vi.stubGlobal("fetch", fetch);
    const first = vi.fn(), second = vi.fn();
    const files = { "index.html": "<h1>Owned preview</h1>" };
    const asset = (id: string) => ({ id, storage_url: `/owned/${id}`, mime_type: "image/png" } as BuilderAsset);
    const frameWindow = { postMessage: vi.fn() };
    const render = (assets: BuilderAsset[], onConsole: typeof first) => {
      hooks.cursor = 0;
      const tree = PreviewFrame({ files, assets, onConsole, device: "desktop", language: "ru", refreshKey: 0 });
      frameRef(tree)!.current = { contentWindow: frameWindow };
    };
    render([asset("old")], first); commit("layout"); commit("passive");
    const reconnect = frameWindow.postMessage.mock.calls.find(([value]) => value.type === "sandu-reconnect")![0];
    const channel = reconnect.channel as string;
    const port = { start: vi.fn(), close: vi.fn(), postMessage: vi.fn(), onmessage: null as ((event: MessageEvent) => void) | null, onmessageerror: null as (() => void) | null };
    const bootstrap = (source: unknown, selectedChannel: string) => listeners.get("message")!({ source, data: { type: "sandu-bootstrap", channel: selectedChannel, bootstrapId: `${selectedChannel}:1` }, ports: [port] } as unknown as MessageEvent);
    bootstrap({}, channel); bootstrap(frameWindow, "foreign-channel"); expect(port.start).not.toHaveBeenCalled();
    bootstrap(frameWindow, channel); expect(port.start).toHaveBeenCalledOnce();
    const message = (data: Record<string, unknown>) => port.onmessage!({ data: { channel, ...data } } as MessageEvent);
    message({ type: "sandu-console", message: "first" }); expect(first).toHaveBeenCalledOnce();
    render([asset("replacement")], second);
    message({ type: "sandu-console", message: "uncommitted" }); expect(second).not.toHaveBeenCalled();
    message({ type: "sandu-asset-request", requestId: "before", reference: "sandu-asset:replacement" }); expect(fetch).not.toHaveBeenCalled();
    commit("layout");
    message({ type: "sandu-console", message: "committed" }); expect(second).toHaveBeenCalledOnce();
    message({ type: "sandu-asset-request", requestId: "old", reference: "sandu-asset:old" }); expect(fetch).not.toHaveBeenCalled();
    message({ type: "sandu-console", channel: "foreign-channel", message: "blocked" }); expect(second).toHaveBeenCalledOnce();
    message({ type: "sandu-asset-request", requestId: "replacement", reference: "sandu-asset:replacement" });
    await vi.waitFor(() => expect(port.postMessage).toHaveBeenCalledWith(expect.objectContaining({ type: "sandu-asset-result", requestId: "replacement", ok: true }), expect.any(Array)));
    expect(fetch).toHaveBeenCalledWith("https://api.example.invalid/owned/replacement", expect.objectContaining({ credentials: "omit", referrerPolicy: "no-referrer" }));
    for (const entry of hooks.slots) { entry.cleanup?.(); entry.cleanup = undefined; }
    expect(port.close).toHaveBeenCalled(); expect(listeners.has("message")).toBe(false);
  });
});
