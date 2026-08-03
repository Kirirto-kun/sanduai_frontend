"use client";

import { useLanguage } from "@/i18n/LanguageContext";
import type { JobState } from "@/types/presentations";
import { getPresentationCopy } from "./copy";

export default function GenerationProgress({
  job,
  completed,
  total,
  onCancel,
  cancelling,
}: {
  job?: JobState | null;
  completed: number;
  total: number;
  onCancel?: () => void;
  cancelling?: boolean;
}) {
  const { language } = useLanguage();
  const copy = getPresentationCopy(language);
  if (!job) return null;
  const status = job.status.toLowerCase();
  const completedWithErrors = status === "completed_with_errors";
  const terminal = ["completed", "completed_with_errors", "failed", "error", "cancelled"].includes(status);
  const displayTotal = job.total ?? (job.kind === "regenerate" ? 1 : total);
  const displayCompleted = job.completed ?? (
    job.kind === "regenerate"
      ? status === "completed" || completedWithErrors ? 1 : 0
      : completed
  );
  const progress = typeof job.progress === "number"
    ? Math.max(0, Math.min(100, job.progress <= 1 ? job.progress * 100 : job.progress))
    : displayTotal > 0
      ? Math.round((displayCompleted / displayTotal) * 100)
      : 0;
  const title = completedWithErrors
    ? copy.partialFailure
    : status === "completed"
    ? copy.jobCompleted
    : status === "failed" || status === "error"
      ? copy.jobFailed
      : status === "queued" || status === "pending"
        ? copy.jobQueued
        : copy.jobRunning;
  const hint = completedWithErrors
    ? copy.jobPartialHint
    : status === "completed"
      ? copy.jobCompletedHint
      : status === "failed" || status === "error"
        ? copy.jobFailedHint
        : status === "cancelled"
          ? copy.jobCancelledHint
          : copy.refreshSafe;

  return (
    <section
      aria-live="polite"
      aria-busy={!terminal}
      className={`rounded-3xl border p-5 shadow-sm sm:p-6 ${
        status === "failed" || status === "error"
          ? "border-rose-200 bg-rose-50"
          : completedWithErrors
            ? "border-amber-200 bg-amber-50"
            : status === "completed"
            ? "border-emerald-200 bg-emerald-50"
            : "border-blue-200 bg-gradient-to-br from-blue-50 to-white"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{copy.generationProgress}</p>
          <h2 className="mt-1 text-lg font-bold text-slate-950">{title}</h2>
          <p className="mt-1 text-sm text-slate-600">{hint}</p>
        </div>
        {!terminal && onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={cancelling}
            className="min-h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 disabled:opacity-50"
          >
            {cancelling ? copy.stopping : copy.stopGeneration}
          </button>
        )}
      </div>
      <div className="mt-5">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
          <span>{copy.generatedOf}: {displayCompleted} / {displayTotal}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div
          className="mt-2 h-2.5 overflow-hidden rounded-full bg-white ring-1 ring-slate-200"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress)}
        >
          <div className="h-full rounded-full bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-400 transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </div>
    </section>
  );
}
