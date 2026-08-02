import { readFile } from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const runtimeSource = readFile(
  path.join(process.cwd(), "node_modules", "@tailwindcss", "browser", "dist", "index.global.js"),
  "utf8",
);

export async function GET() {
  return new Response(await runtimeSource, {
    headers: {
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Type": "text/javascript; charset=utf-8",
      "Cross-Origin-Resource-Policy": "cross-origin",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
