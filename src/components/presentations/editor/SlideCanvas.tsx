"use client";

import { useLanguage } from "@/i18n/LanguageContext";
import type { PresentationMode, PresentationSlide, SlideSpec } from "@/types/presentations";
import { ProtectedImage } from "../PresentationUI";
import { getPresentationCopy } from "../copy";
import { normalizeSlideSpec, slideImageSource, slideTitle } from "../slide-utils";

const themeClasses: Record<string, { frame: string; accent: string; muted: string; card: string }> = {
  sand: { frame: "bg-[#fffaf0] text-slate-900", accent: "bg-orange-500", muted: "text-slate-600", card: "bg-white/80 border-orange-100" },
  ocean: { frame: "bg-gradient-to-br from-sky-50 to-blue-100 text-slate-950", accent: "bg-blue-600", muted: "text-blue-900/70", card: "bg-white/75 border-blue-200" },
  forest: { frame: "bg-gradient-to-br from-emerald-50 to-teal-100 text-emerald-950", accent: "bg-emerald-600", muted: "text-emerald-900/70", card: "bg-white/75 border-emerald-200" },
  night: { frame: "bg-gradient-to-br from-slate-950 to-indigo-950 text-white", accent: "bg-cyan-400", muted: "text-slate-300", card: "bg-white/10 border-white/15" },
  warm_classroom: { frame: "bg-[#fffaf0] text-slate-900", accent: "bg-orange-500", muted: "text-slate-600", card: "bg-white/80 border-orange-100" },
  academic_blue: { frame: "bg-gradient-to-br from-sky-50 to-blue-100 text-slate-950", accent: "bg-blue-600", muted: "text-blue-900/70", card: "bg-white/75 border-blue-200" },
  nature: { frame: "bg-gradient-to-br from-emerald-50 to-teal-100 text-emerald-950", accent: "bg-emerald-600", muted: "text-emerald-900/70", card: "bg-white/75 border-emerald-200" },
  high_contrast: { frame: "bg-gradient-to-br from-slate-950 to-indigo-950 text-white", accent: "bg-cyan-400", muted: "text-slate-300", card: "bg-white/10 border-white/15" },
};

function ClassicPreview({ slide, themeId }: { slide: PresentationSlide; themeId: string }) {
  const { language } = useLanguage();
  const copy = getPresentationCopy(language);
  const spec = normalizeSlideSpec(slide.spec);
  const theme = themeClasses[themeId] ?? themeClasses.academic_blue;
  const title = slideTitle(slide, copy.previewUnavailable);
  const body = typeof spec.body === "string" ? spec.body : "";
  const bullets = Array.isArray(spec.bullets) ? spec.bullets.filter((item): item is string => typeof item === "string") : [];
  const layout = String(spec.layout ?? "auto");
  const compactBody = body.length > 420 ? `${body.slice(0, 417)}…` : body;
  const visibleBullets = bullets.slice(0, 6);

  return (
    <div className={`relative flex h-full w-full flex-col overflow-hidden p-[5%] ${theme.frame}`}>
      <div className={`absolute left-0 top-0 h-full w-[1.2%] ${theme.accent}`} />
      <div className="relative z-10">
        <div className={`mb-[2.5%] h-1 w-[12%] rounded-full ${theme.accent}`} />
        <h2 className="max-w-[90%] text-[clamp(1rem,3vw,2.25rem)] font-bold leading-tight tracking-tight">{title}</h2>
        {typeof spec.subtitle === "string" && spec.subtitle && <p className={`mt-[1.5%] text-[clamp(.65rem,1.45vw,1.05rem)] ${theme.muted}`}>{spec.subtitle}</p>}
      </div>

      <div className={`relative z-10 mt-[4%] min-h-0 flex-1 ${layout === "two_columns" || layout === "comparison" ? "grid grid-cols-2 gap-[3%]" : ""}`}>
        <div className={`${layout === "cards" ? "grid grid-cols-2 gap-[2%]" : ""}`}>
          {compactBody && <p className={`text-[clamp(.62rem,1.55vw,1.15rem)] leading-relaxed ${theme.muted}`}>{compactBody}</p>}
          {visibleBullets.length > 0 && (
            <ul className={`${compactBody ? "mt-[3%]" : ""} space-y-[2%]`}>
              {visibleBullets.map((bullet, index) => (
                <li key={`${bullet}-${index}`} className={`flex items-start gap-[2%] text-[clamp(.6rem,1.45vw,1.05rem)] leading-snug ${theme.muted}`}>
                  <span className={`mt-[.45em] h-[.45em] w-[.45em] shrink-0 rounded-full ${theme.accent}`} />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        {(layout === "two_columns" || layout === "comparison") && (
          <div className={`rounded-[1.2vw] border p-[7%] ${theme.card}`}>
            <div className={`h-2 w-2/3 rounded-full opacity-40 ${theme.accent}`} />
            <div className="mt-[7%] space-y-[5%]">
              {[0, 1, 2].map((item) => <div key={item} className={`h-2 rounded-full opacity-15 ${theme.accent}`} style={{ width: `${85 - item * 13}%` }} />)}
            </div>
          </div>
        )}
      </div>
      <span className={`absolute bottom-[3%] right-[4%] text-[clamp(.5rem,1vw,.75rem)] font-semibold ${theme.muted}`}>{slide.order}</span>
    </div>
  );
}

export default function SlideCanvas({
  mode,
  slide,
  themeId = "academic_blue",
  preferDraftPreview = false,
}: {
  mode: PresentationMode;
  slide: PresentationSlide | null;
  themeId?: string;
  preferDraftPreview?: boolean;
}) {
  const { language } = useLanguage();
  const copy = getPresentationCopy(language);
  if (!slide) return <div className="flex min-h-72 items-center justify-center text-sm text-slate-500">{copy.selectSlide}</div>;
  const source = slideImageSource(slide);
  const title = slideTitle(slide, copy.selectedSlide);
  const waiting = ["planned", "approved", "queued", "generating", "uploading", "qa"].includes(slide.status);

  return (
    <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto bg-slate-100/80 p-3 sm:p-6 lg:p-8">
      <div className="relative aspect-video w-full max-w-5xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl sm:rounded-2xl">
        {mode === "creative" ? (
          source ? (
            <ProtectedImage source={source} alt={title} className="h-full w-full object-contain" />
          ) : (
            <div className="flex h-full flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-violet-50 p-6 text-center">
              {slide.status === "failed" ? (
                <>
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-2xl font-black text-rose-700" aria-hidden="true">!</span>
                  <p className="mt-3 font-bold text-rose-800">{copy.failedSlide}</p>
                  <p className="mt-1 max-w-sm text-sm leading-6 text-rose-700">{copy.failedSlideHelp}</p>
                </>
              ) : waiting ? (
                <><div className="h-10 w-10 animate-spin rounded-full border-4 border-violet-200 border-t-violet-600" /><p className="mt-4 text-sm font-semibold text-slate-600">{copy.waitingSlide}</p></>
              ) : (
                <p className="text-sm font-semibold text-slate-500">{copy.previewUnavailable}</p>
              )}
            </div>
          )
        ) : source && !preferDraftPreview ? (
          <ProtectedImage source={source} alt={title} className="h-full w-full object-contain" />
        ) : slide.status === "failed" && !preferDraftPreview ? (
          <div className="flex h-full flex-col items-center justify-center bg-rose-50 p-6 text-center text-rose-800">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-2xl font-black text-rose-700" aria-hidden="true">!</span>
            <p className="mt-3 font-bold">{copy.failedSlide}</p>
            <p className="mt-1 max-w-sm text-sm leading-6 text-rose-700">{copy.failedSlideHelp}</p>
          </div>
        ) : (
          <ClassicPreview slide={slide} themeId={themeId} />
        )}
        {mode === "classic" && preferDraftPreview && (
          <span className="absolute right-3 top-3 rounded-full bg-slate-950/80 px-3 py-1 text-[10px] font-bold text-white shadow-sm">
            {copy.provisionalPreview}
          </span>
        )}
      </div>
    </div>
  );
}

export function cleanSpecForSave(spec: SlideSpec) {
  return Object.fromEntries(Object.entries(spec).filter(([, value]) => value !== undefined));
}
