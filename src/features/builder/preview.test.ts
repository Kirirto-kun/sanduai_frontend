import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { compilePreview, isPreviewMessage, needsThreeRuntime } from "./preview";

describe("builder preview sandbox", () => {
  it("inlines project-owned CSS and JavaScript", () => {
    const output = compilePreview({
      "index.html": '<!doctype html><html><head><link href="styles.css" rel="stylesheet"></head><body><script src="app.js"></script></body></html>',
      "styles.css": "body { color: tomato; }",
      "app.js": "console.log('ready')",
    }, "channel-1");

    expect(output).toContain("<style>body { color: tomato; }</style>");
    expect(output).toContain("console.log('ready')");
    expect(output).not.toContain('href="styles.css"');
    expect(output).not.toContain('src="app.js"');
  });

  it("keeps hidden elements hidden after generated overlay styles", () => {
    const output = compilePreview({
      "index.html": '<link href="styles.css" rel="stylesheet"><section class="overlay" hidden>Done</section><script>window.initialDisplay=getComputedStyle(document.querySelector(".overlay")).display</script>',
      "styles.css": ".overlay{display:flex}",
    }, "channel-hidden");

    const authorRule = output.indexOf(".overlay{display:flex}");
    const firstHiddenInvariant = output.indexOf("[hidden]{display:none!important}");
    const lastHiddenInvariant = output.lastIndexOf("[hidden]{display:none!important}");
    const projectScript = output.indexOf("window.initialDisplay=");
    expect(authorRule).toBeGreaterThan(-1);
    expect(firstHiddenInvariant).toBeLessThan(projectScript);
    expect(lastHiddenInvariant).toBeGreaterThan(authorRule);
    expect(firstHiddenInvariant).not.toBe(lastHiddenInvariant);
    expect(output.match(/data-sandu-preview-invariants/g)).toHaveLength(3);
  });

  it("injects a restrictive policy and the safe camera bridge", () => {
    const output = compilePreview({ "index.html": "<main>Hello</main>" }, "safe-channel");

    expect(output).toContain("default-src 'none'");
    expect(output).toContain("form-action 'none'");
    expect(output).toContain("object-src 'none'");
    expect(output).toContain("window.sanduCamera");
    expect(output).toContain("window.sanduAssets");
    expect(output).toContain("img-src data: blob:; media-src data: blob:");
    expect(output).toContain("connect-src data: blob:");
    expect(output).toContain("new MessageChannel()");
    expect(output).toContain("sandu-bootstrap");
    expect(output).toContain("bootstrapId");
    expect(output).toContain("sandu-ping");
    expect(output).toContain("sandu-pong");
    expect(output).toContain("sandu-reconnect");
    expect(output).toContain("reconnect()");
    expect(output).toContain("shouldReplay");
    expect(output).toContain("request.reference");
    expect(output).toContain("window.navigation?.addEventListener('navigate'");
    expect(output).toContain("MutationObserver");
    expect(output).toContain("Network access is disabled in Sandu preview");
    expect(output).toContain("'XMLHttpRequest'");
    expect(output).toContain("'RTCPeerConnection'");
    expect(output).toContain("dns-prefetch|preconnect|prefetch|prerender|modulepreload");
    expect(output).not.toContain("type:'sandu-connect',");
    expect(output).not.toContain("https://cdn.jsdelivr.net");
    expect(output).toContain("safe-channel");
    expect(output).not.toContain("allow-same-origin");
  });

  it("substitutes the exact pinned Three.js imports with the vendored runtime", () => {
    const output = compilePreview({
      "index.html": '<script type="module" src="app.js"></script>',
      "app.js": [
        'import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js";',
        'import { OrbitControls as Controls } from "https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/controls/OrbitControls.js";',
        'import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";',
        "console.log(THREE.Scene, Controls, GLTFLoader);",
      ].join("\n"),
    }, "channel-three", "/*! audited */globalThis.THREE=Object.freeze({});");

    expect(output).toContain("/*! audited */globalThis.THREE=Object.freeze({});");
    expect(output).toContain("const THREE = globalThis.THREE;");
    expect(output).toContain("const { OrbitControls: Controls } = globalThis.THREE;");
    expect(output).toContain("const { GLTFLoader } = globalThis.THREE;");
    expect(output).not.toContain("https://cdn.jsdelivr.net");
    expect(output.indexOf("globalThis.THREE=Object.freeze"))
      .toBeLessThan(output.indexOf("const THREE = globalThis.THREE"));
  });

  it("loads the 3D runtime only for projects that use the supported Three.js surface", () => {
    expect(needsThreeRuntime({ "index.html": "<main>2D</main>" })).toBe(false);
    expect(needsThreeRuntime({ "app.js": 'import * as T from "three";' })).toBe(true);
    expect(needsThreeRuntime({ "app.js": "const loader = new GLTFLoader();" })).toBe(true);
  });

  it("keeps the vendored Three.js runtime bounded and network-free", () => {
    const runtime = readFileSync(
      new URL("../../../public/builder-runtime/sandu-three-0.169.0.min.js", import.meta.url),
      "utf8",
    );

    expect(runtime.length).toBeLessThan(2 * 1024 * 1024);
    expect(runtime).toMatch(/^\/\*! Three\.js r169 \(MIT\)/);
    expect(runtime).toContain("globalThis.THREE=Object.freeze");
    expect(runtime.match(/https?:\/\/[^"'`\s)]+/g)).toEqual(["http://www.w3.org/1999/xhtml"]);
    expect(runtime).not.toMatch(/cdn\.jsdelivr\.net|storage\.googleapis\.com/);
    expect(runtime).not.toMatch(/\beval\s*\(|\bnew\s+Function\b/);
    expect(runtime).not.toMatch(/<\/script/i);
  });

  it("resolves local data, SVG, and CSS url files without network access", () => {
    const output = compilePreview({
      "index.html": '<link href="styles.css" rel="stylesheet"><img src="icon.svg"><script src="app.js"></script>',
      "styles.css": 'main { background-image: url("icon.svg"); }',
      "app.js": "fetch('./data.json').then(response => response.json())",
      "data.json": '{"ready":true}',
      "icon.svg": '<svg xmlns="http://www.w3.org/2000/svg"><circle r="4"/></svg>',
    }, "channel-files");

    expect(output).toContain("window.fetch=");
    expect(output).toContain('"data.json":"{\\"ready\\":true}"');
    expect(output).toContain("data:image/svg+xml;charset=utf-8,%3Csvg");
    expect(output).not.toContain('src="icon.svg"');
    expect(output).not.toContain('url("icon.svg")');
  });

  it("accepts messages only from the exact iframe and channel", () => {
    const source = {} as Window;
    const base = { source, data: { type: "sandu-console", channel: "expected" } } as unknown as MessageEvent;

    expect(isPreviewMessage(base, source, "expected")).toBe(true);
    expect(isPreviewMessage({ ...base, data: { ...base.data, channel: "other" } } as MessageEvent, source, "expected")).toBe(false);
    expect(isPreviewMessage(base, {} as Window, "expected")).toBe(false);
  });

  it("places the policy before adversarial fake head markup", () => {
    const fakeHead = '<!-- <head> --><script>console.log("untrusted")</script>';
    const output = compilePreview({ "index.html": fakeHead }, "channel-2");

    expect(output.indexOf("Content-Security-Policy")).toBeGreaterThan(-1);
    expect(output.indexOf("Content-Security-Policy")).toBeLessThan(output.indexOf("<!-- <head> -->"));
    expect(output.startsWith("<!doctype html><html><head>")).toBe(true);
  });
});
