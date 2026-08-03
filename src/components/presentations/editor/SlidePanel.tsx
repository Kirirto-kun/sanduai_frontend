"use client";

import { useLanguage } from "@/i18n/LanguageContext";
import type { PresentationMode, PresentationSlide } from "@/types/presentations";
import { ProtectedImage, SlideStatusDot } from "../PresentationUI";
import { getPresentationCopy } from "../copy";
import { qaWarnings, slideImageSource, slideTitle } from "../slide-utils";

export default function SlidePanel({
  mode,
  slides,
  selectedKey,
  onSelect,
}: {
  mode: PresentationMode;
  slides: PresentationSlide[];
  selectedKey: string | null;
  onSelect: (slideKey: string) => void;
}) {
  const { language } = useLanguage();
  const copy = getPresentationCopy(language);
  return (
    <aside className="min-w-0 border-b border-slate-200 bg-slate-50/80 lg:w-64 lg:shrink-0 lg:border-b-0 lg:border-r">
      <div className="flex items-center justify-between px-4 py-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">{copy.slides}</h2>
        <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-slate-500 ring-1 ring-slate-200">{slides.length}</span>
      </div>
      <div className="flex gap-2 overflow-x-auto px-3 pb-3 lg:max-h-[calc(100vh-15rem)] lg:flex-col lg:overflow-y-auto lg:overflow-x-hidden" role="list" aria-label={copy.slides}>
        {slides.map((slide, index) => {
          const selected = slide.slide_key === selectedKey;
          const title = slideTitle(slide, `${copy.slide} ${index + 1}`);
          const source = slideImageSource(slide);
          const warnings = qaWarnings(slide);
          const failed = slide.status.toLowerCase() === "failed";
          return (
            <div key={slide.slide_key} role="listitem" className="w-40 shrink-0 lg:w-full">
            <button
              type="button"
              aria-pressed={selected}
              aria-label={`${index + 1}. ${title}${failed ? ` — ${copy.failedSlide}` : ""}`}
              onClick={() => onSelect(slide.slide_key)}
              className={`relative w-full rounded-2xl border-2 p-2 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 ${
                selected
                  ? failed ? "border-rose-600 bg-rose-50 shadow-md" : "border-slate-900 bg-white shadow-md"
                  : failed ? "border-rose-300 bg-rose-50/70 hover:border-rose-500" : "border-transparent bg-white/70 hover:border-slate-300"
              }`}
            >
              <div className="relative aspect-video overflow-hidden rounded-lg bg-slate-100">
                {source ? (
                  <ProtectedImage source={source} alt={title} className="h-full w-full object-cover" />
                ) : (
                  <div className={`flex h-full flex-col justify-end p-2 ${mode === "classic" ? "bg-gradient-to-br from-sky-50 to-emerald-50" : "bg-slate-100"}`}>
                    <div className="h-1 w-8 rounded bg-slate-300" />
                    <p className="mt-1 line-clamp-2 text-[9px] font-bold leading-tight text-slate-700">{title}</p>
                  </div>
                )}
                <span className="absolute left-1.5 top-1.5 flex h-6 min-w-6 items-center justify-center rounded-md bg-slate-950/75 px-1 text-[10px] font-bold text-white">{index + 1}</span>
                {warnings.length > 0 && <span title={copy.qaWarning} className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-amber-400 text-xs font-bold text-amber-950">!</span>}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <SlideStatusDot status={slide.status} />
                <span className="min-w-0 flex-1 truncate text-xs font-semibold text-slate-700">{title}</span>
                {failed && <span className="rounded-full bg-rose-100 px-1.5 py-0.5 text-[9px] font-bold text-rose-800">!</span>}
              </div>
            </button>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
