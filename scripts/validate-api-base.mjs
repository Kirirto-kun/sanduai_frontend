import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import { readFile } from "node:fs/promises";
import ts from "typescript";

const source = await readFile(new URL("../src/lib/api-base.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ES2022,
    target: ts.ScriptTarget.ES2022,
  },
  fileName: "api-base.ts",
}).outputText;
const moduleUrl = `data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`;
const { resolveApiBase } = await import(moduleUrl);

assert.equal(
  resolveApiBase(undefined, "development"),
  "http://127.0.0.1:8000",
  "development should have an explicit loopback fallback",
);
assert.equal(
  resolveApiBase(undefined, "test"),
  "http://127.0.0.1:8000",
  "tests should have the same deterministic fallback",
);
assert.equal(
  resolveApiBase(" https://api.sanduai.example/v1/ ", "production"),
  "https://api.sanduai.example/v1",
  "a production HTTPS URL should be trimmed and normalized",
);

assert.throws(
  () => resolveApiBase(undefined, "production"),
  /required outside development\/test/,
);
assert.throws(
  () => resolveApiBase(undefined, undefined),
  /required outside development\/test/,
);
assert.throws(
  () => resolveApiBase("http://api.sanduai.example", "production"),
  /must use HTTPS outside development\/test/,
);
assert.throws(
  () => resolveApiBase("http://127.0.0.1:8000", "staging"),
  /must use HTTPS outside development\/test/,
);
assert.throws(
  () => resolveApiBase("https://127.0.0.1:8000", "production"),
  /must not point to localhost/,
);
assert.throws(
  () => resolveApiBase("https://localhost:8000", "production"),
  /must not point to localhost/,
);
assert.throws(
  () => resolveApiBase("api.sanduai.example", "production"),
  /must be an absolute URL/,
);
assert.throws(
  () => resolveApiBase("https://user:pass@api.sanduai.example", "production"),
  /must not contain credentials/,
);

console.log("NEXT_PUBLIC_API_BASE validation passed.");
