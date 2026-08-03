"use client";

import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useActivateSlideVersion, useRegenerateSlide } from "@/hooks/usePresentations";
import type { PresentationSlide } from "@/types/presentations";
import { getPresentationCopy } from "../copy";
import { presentationErrorMessage, qaWarningMessage } from "../error-copy";
import { activeVersion, normalizeSlideSpec, qaWarnings } from "../slide-utils";

export default function CreativeReviewPanel({
  presentationId,
  slide,
  regenerationActive = false,
  onJobStarted,
}: {
  presentationId: string;
  slide: PresentationSlide;
  regenerationActive?: boolean;
  onJobStarted?: (jobId: string) => void;
}) {
  const { language } = useLanguage();
  const copy = getPresentationCopy(language);
  const regenerateMutation = useRegenerateSlide();
  const activateMutation = useActivateSlideVersion();
  const [error, setError] = useState<string | null>(null);
  const [instruction, setInstruction] = useState("");
  const warnings = qaWarnings(slide);
  const versions = slide.versions ?? [];
  const current = activeVersion(slide);
  const normalizedStatus = slide.status.toLowerCase();
  const failed = normalizedStatus === "failed";
  const accepted = normalizedStatus === "accepted" || normalizeSlideSpec(slide.spec).review_status === "accepted";
  const settled = !["planned", "approved", "queued", "generating", "uploading"].includes(normalizedStatus);
  const canAccept = settled && !failed && Boolean(current?.id);

  const regenerate = async () => {
    setError(null);
    try {
      const job = await regenerateMutation.mutateAsync({
        presentationId,
        slideKey: slide.slide_key,
        instruction,
      });
      onJobStarted?.(job.job_id);
      setInstruction("");
    } catch (caught) {
      setError(presentationErrorMessage(caught, copy));
    }
  };

  const accept = async () => {
    setError(null);
    try {
      if (!current?.id) return;
      await activateMutation.mutateAsync({
        presentationId,
        slideKey: slide.slide_key,
        versionId: current.id,
      });
    } catch (caught) {
      setError(presentationErrorMessage(caught, copy));
    }
  };

  const activate = async (versionId: string) => {
    setError(null);
    try {
      await activateMutation.mutateAsync({ presentationId, slideKey: slide.slide_key, versionId });
    } catch (caught) {
      setError(presentationErrorMessage(caught, copy));
    }
  };

  return (
    <aside className="w-full border-t border-slate-200 bg-white p-4 lg:w-80 lg:shrink-0 lg:border-l lg:border-t-0 lg:overflow-y-auto">
      <h2 className="text-sm font-bold text-slate-900">{copy.selectedSlide}</h2>
      {failed && (
        <div role="alert" className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-900">
          <p className="text-sm font-bold">{copy.failedSlide}</p>
          <p className="mt-1 text-xs leading-5 text-rose-700">{copy.failedSlideHelp}</p>
        </div>
      )}
      <p className="mt-2 rounded-xl bg-violet-50 p-3 text-xs leading-5 text-violet-800">{copy.exactTextWarning}</p>

      <section className="mt-5" aria-labelledby="creative-qa-title">
        <div className="flex items-center justify-between gap-2">
          <h3 id="creative-qa-title" className="text-xs font-bold uppercase tracking-wide text-slate-500">{copy.qaTitle}</h3>
          <span className={`h-2.5 w-2.5 rounded-full ${warnings.length ? "bg-amber-500" : "bg-emerald-500"}`} aria-hidden="true" />
        </div>
        {warnings.length ? (
          <ul className="mt-2 space-y-2">
            {warnings.map((warning, index) => (
              <li key={warning.id ?? `${warning.code}-${index}`} className={`rounded-xl border p-3 text-xs leading-5 ${warning.severity === "critical" ? "border-rose-200 bg-rose-50 text-rose-800" : "border-amber-200 bg-amber-50 text-amber-900"}`}>
                <span className="font-bold">{copy.qaWarning}</span>
                <span className="mt-1 block">{qaWarningMessage(warning, copy)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 rounded-xl bg-emerald-50 p-3 text-xs leading-5 text-emerald-800">{copy.qaClean}</p>
        )}
      </section>

      {versions.length > 0 && (
        <section className="mt-5" aria-labelledby="creative-versions-title">
          <h3 id="creative-versions-title" className="text-xs font-bold uppercase tracking-wide text-slate-500">{copy.versions}</h3>
          <div className="mt-2 space-y-2">
            {versions.map((version, index) => {
              const active = version.id === (slide.active_version_id ?? current?.id);
              return (
                <div key={version.id} className={`flex min-h-12 items-center justify-between gap-3 rounded-xl border px-3 ${active ? "border-violet-300 bg-violet-50" : "border-slate-200 bg-white"}`}>
                  <div>
                    <p className="text-sm font-bold text-slate-800">{copy.version} {version.version ?? index + 1}</p>
                    {version.created_at && <p className="text-[10px] text-slate-400">{new Intl.DateTimeFormat(language === "kk" ? "kk-KZ" : "ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(version.created_at))}</p>}
                  </div>
                  {active ? (
                    <span className="rounded-full bg-violet-100 px-2 py-1 text-[10px] font-bold text-violet-800">{copy.activeVersion}</span>
                  ) : (
                    <button type="button" onClick={() => void activate(version.id)} disabled={activateMutation.isPending || regenerationActive} className="min-h-11 rounded-lg px-3 text-xs font-bold text-violet-700 hover:bg-violet-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 disabled:opacity-50">{copy.useVersion}</button>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {error && <p role="alert" className="mt-4 rounded-xl bg-rose-50 p-3 text-xs text-rose-800">{error}</p>}
      <div className="mt-5 space-y-2">
        <button type="button" onClick={() => void accept()} disabled={!canAccept || accepted || activateMutation.isPending || regenerationActive} className="min-h-12 w-full rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:opacity-45">{accepted ? copy.accepted : copy.acceptSlide}</button>
        <label htmlFor="creative-regeneration-instruction" className="block pt-2 text-xs font-bold uppercase tracking-wide text-slate-500">{copy.regenerationInstruction}</label>
        <textarea id="creative-regeneration-instruction" rows={3} maxLength={2000} value={instruction} onChange={(event) => setInstruction(event.target.value)} placeholder={copy.regenerationInstructionPlaceholder} className="min-h-20 w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-violet-300 focus:ring-2 focus:ring-violet-200" />
        <button type="button" onClick={() => void regenerate()} disabled={!settled || regenerateMutation.isPending || regenerationActive} className={`min-h-12 w-full rounded-xl border px-4 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 disabled:opacity-45 ${failed ? "border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-100 focus-visible:ring-rose-500" : "border-violet-200 bg-violet-50 text-violet-800 hover:bg-violet-100 focus-visible:ring-violet-500"}`}>{regenerateMutation.isPending || regenerationActive ? copy.regenerating : failed ? copy.retryFailedSlide : copy.regenerate}</button>
      </div>
    </aside>
  );
}
