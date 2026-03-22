"use client";

import type { Slide } from "@/types/presenton";
import { assetUrl } from "@/lib/presenton-api";

interface Props {
  slide: Slide;
}

/**
 * Renders a single slide's content.
 *
 * For HTML-based slides, renders the html_content directly.
 * For JSON-based slides, renders structured content (title, body, bullets, image).
 */
export default function SlideContentRenderer({ slide }: Props) {
  // If the slide has pre-rendered HTML, use it
  if (slide.html_content) {
    return (
      <div
        className="h-full w-full p-8"
        dangerouslySetInnerHTML={{ __html: rewriteImageUrls(slide.html_content) }}
      />
    );
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
            <img
              src={assetUrl(c.image)}
              alt=""
              className="max-h-full max-w-full rounded-lg object-contain"
            />
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Rewrite image src attributes in HTML content to use the asset proxy.
 */
function rewriteImageUrls(html: string): string {
  return html.replace(
    /src="(\/app_data\/[^"]+)"/g,
    (_match, path) => `src="${assetUrl(path)}"`,
  );
}
