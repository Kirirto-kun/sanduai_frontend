"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { Slide } from "@/types/presenton";
import { fetchAssetBlob } from "@/lib/presenton-api";

interface Props {
  slide: Slide;
}

const MAX_EMBEDDED_SLIDE_IMAGES = 20;
const MAX_EMBEDDED_SLIDE_BYTES = 30 * 1024 * 1024;

/**
 * Renders a single slide's content.
 *
 * HTML-based slides run in an isolated frame with only the pinned styling runtime.
 * Presentation HTML is generated outside React and must never be inserted into
 * the application DOM.
 * For JSON-based slides, renders structured content (title, body, bullets, image).
 */
export default function SlideContentRenderer({ slide }: Props) {
  // If the slide has pre-rendered HTML, use it
  if (slide.html_content) {
    return <AuthenticatedHtmlSlide html={slide.html_content} />;
  }

  const c = slide.content;

  return (
    <div className="flex h-full w-full flex-col justify-between p-8">
      {/* Title */}
      {c.title && (
        <h2 className="mb-4 text-2xl font-bold text-slate-900">{c.title}</h2>
      )}

      {/* Subtitle */}
      {c.subtitle && (
        <p className="mb-4 text-lg text-slate-600">{c.subtitle}</p>
      )}

      {/* Body */}
      <div className="flex flex-1 gap-6">
        <div className="flex-1">
          {c.body && <p className="text-sm text-slate-700">{c.body}</p>}

          {/* Bullets */}
          {c.bullets && c.bullets.length > 0 && (
            <ul className="mt-3 space-y-2">
              {c.bullets.map((bullet, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                  <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-indigo-500" />
                  {bullet}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Image */}
        {c.image && (
          <div className="flex w-1/3 flex-shrink-0 items-center justify-center">
            <AuthenticatedImage path={c.image} />
          </div>
        )}
      </div>
    </div>
  );
}

function AuthenticatedImage({ path }: { path: string }) {
  const { objectUrl, failed } = usePrivateAsset(path);

  if (failed) {
    return (
      <div className="flex h-28 w-full items-center justify-center rounded-lg bg-slate-100 text-xs text-slate-500">
        Image unavailable
      </div>
    );
  }
  if (!objectUrl) {
    return <div className="h-28 w-full animate-pulse rounded-lg bg-slate-100" />;
  }
  return (
    <div className="relative h-full min-h-28 w-full">
      <Image
        src={objectUrl}
        alt=""
        fill
        unoptimized
        sizes="33vw"
        className="rounded-lg object-contain"
      />
    </div>
  );
}

function AuthenticatedHtmlSlide({ html }: { html: string }) {
  const [prepared, setPrepared] = useState<{
    html: string;
    srcDoc: string;
  } | null>(null);
  const srcDoc = prepared?.html === html ? prepared.srcDoc : null;

  useEffect(() => {
    const controller = new AbortController();
    let disposed = false;

    async function prepare() {
      const paths = Array.from(
        new Set(
          Array.from(
            html.matchAll(/src=(["'])((?:\/app_data|\/static)\/[^"']+)\1/g),
          ).map((match) => match[2]),
        ),
      );
      const replacements = new Map<string, string>();
      let embeddedBytes = 0;
      for (const [index, path] of paths.entries()) {
        const remainingBytes = MAX_EMBEDDED_SLIDE_BYTES - embeddedBytes;
        if (index >= MAX_EMBEDDED_SLIDE_IMAGES || remainingBytes <= 0) {
          replacements.set(path, "data:,");
          continue;
        }
        try {
          const blob = await fetchAssetBlob(path, controller.signal, remainingBytes);
          embeddedBytes += blob.size;
          replacements.set(path, await imageBlobToDataUrl(blob, controller.signal));
        } catch (error) {
          if (error instanceof DOMException && error.name === "AbortError") return;
          replacements.set(path, "data:,");
        }
      }

      if (!disposed) {
        const rewritten = html.replace(
          /src=(["'])((?:\/app_data|\/static)\/[^"']+)\1/g,
          (_match, quote, path) =>
            `src=${quote}${replacements.get(path) ?? "data:,"}${quote}`,
        );
        setPrepared({ html, srcDoc: withSlideRuntime(rewritten) });
      }
    }

    void prepare();
    return () => {
      disposed = true;
      controller.abort();
    };
  }, [html]);

  if (srcDoc === null) {
    return <div className="h-full w-full animate-pulse bg-slate-100" />;
  }
  return (
    <iframe
      className="h-full w-full border-0 bg-white"
      referrerPolicy="no-referrer"
      sandbox="allow-scripts"
      srcDoc={srcDoc}
      title="Presentation slide preview"
    />
  );
}

function imageBlobToDataUrl(blob: Blob, signal: AbortSignal): Promise<string> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }
    const reader = new FileReader();
    const abort = () => reader.abort();
    const cleanup = () => signal.removeEventListener("abort", abort);
    reader.addEventListener("load", () => {
      cleanup();
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("Could not encode the private slide image"));
    }, { once: true });
    reader.addEventListener("error", () => {
      cleanup();
      reject(reader.error ?? new Error("Could not read the private slide image"));
    }, { once: true });
    reader.addEventListener("abort", () => {
      cleanup();
      reject(new DOMException("Aborted", "AbortError"));
    }, { once: true });
    signal.addEventListener("abort", abort, { once: true });
    reader.readAsDataURL(blob);
  });
}

function usePrivateAsset(path: string) {
  const [state, setState] = useState<{
    path: string;
    objectUrl: string | null;
    failed: boolean;
  }>({ path, objectUrl: null, failed: false });

  useEffect(() => {
    const controller = new AbortController();
    let objectUrl: string | null = null;
    let disposed = false;
    void fetchAssetBlob(path, controller.signal)
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        if (disposed) {
          URL.revokeObjectURL(url);
          return;
        }
        objectUrl = url;
        setState({ path, objectUrl, failed: false });
      })
      .catch((error) => {
        if (!disposed && !(error instanceof DOMException && error.name === "AbortError")) {
          setState({ path, objectUrl: null, failed: true });
        }
      });

    return () => {
      disposed = true;
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [path]);

  return state.path === path
    ? state
    : { path, objectUrl: null, failed: false };
}

function withSlideRuntime(html: string): string {
  const runtimePath = "/api/presenton/tailwind-runtime";
  const runtimeSource = `${window.location.origin}${runtimePath}`;
  const runtimeUrl = `${runtimeSource}?v=4.3.3`;
  const csp =
    "<meta http-equiv=\"Content-Security-Policy\" content=\"default-src 'none'; " +
    "img-src blob: data:; style-src 'unsafe-inline'; font-src blob: data:; " +
    `script-src ${runtimeSource}; connect-src 'none'; ` +
    "object-src 'none'; frame-src 'none'; base-uri 'none'; form-action 'none'\">";
  const runtime = `<script src="${runtimeUrl}"></script>`;
  const parsed = new DOMParser().parseFromString(html, "text/html");
  parsed
    .querySelectorAll("script, iframe, object, embed, form, base, link, meta[http-equiv]")
    .forEach((element) => element.remove());
  const inlineStyles = Array.from(parsed.head.querySelectorAll("style"))
    .map((style) => style.outerHTML)
    .join("");
  return `<!doctype html><html><head>${csp}${runtime}${inlineStyles}</head><body>${parsed.body.innerHTML}</body></html>`;
}
