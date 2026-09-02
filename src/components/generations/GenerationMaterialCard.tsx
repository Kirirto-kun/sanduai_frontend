"use client";

import { useState } from "react";
import Link from "next/link";

import type { GenerationJobSummary } from "../../lib/api";
import { downloadGenerationMaterial } from "../../lib/generation-download";
import {
  generationExpiryCopy,
  generationSourceHref,
  isActiveGenerationJob,
} from "../../lib/generation-history";


const STATUS_COPY = {
  queued: { ru: "В очереди", kk: "Кезекте" },
  running: { ru: "Создаётся", kk: "Жасалып жатыр" },
  settling: { ru: "Сохраняется", kk: "Сақталып жатыр" },
  refunding: { ru: "Возвращаем монеты", kk: "Монеталар қайтарылуда" },
  completed: { ru: "Готово", kk: "Дайын" },
  failed: { ru: "Не получилось", kk: "Жасалмады" },
  cancelled: { ru: "Отменено", kk: "Тоқтатылды" },
  billing_error: { ru: "Готово", kk: "Дайын" },
} as const;


export type GenerationMaterialCardProps = {
  job: GenerationJobSummary;
  language: "ru" | "kk";
  openHref?: string;
  onDownload?: (job: GenerationJobSummary) => Promise<void>;
  onActionError?: (error: unknown) => void;
};


export function GenerationMaterialCard({
  job,
  language,
  openHref = generationSourceHref(job),
  onDownload,
  onActionError,
}: GenerationMaterialCardProps) {
  const [downloading, setDownloading] = useState(false);
  const active = isActiveGenerationJob(job);
  const downloadable = job.status === "completed" || job.status === "billing_error";
  const current = Math.max(0, Number(job.progress.current ?? 0));
  const total = Math.max(1, Number(job.progress.total ?? 1));
  const percentage = Math.max(4, Math.min(100, (current / total) * 100));

  const download = async () => {
    if (!downloadable || downloading) return;
    setDownloading(true);
    try {
      if (onDownload) await onDownload(job);
      else await downloadGenerationMaterial(job, language);
    } catch (error) {
      onActionError?.(error);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <article className="flex min-h-48 flex-col rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            {STATUS_COPY[job.status][language]}
          </p>
          <h3 className="mt-1 line-clamp-2 text-lg font-bold text-slate-950">{job.title}</h3>
        </div>
        <span
          aria-hidden="true"
          className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
            downloadable
              ? "bg-emerald-500"
              : job.status === "failed" || job.status === "cancelled"
                ? "bg-rose-500"
                : "animate-pulse bg-sky-500"
          }`}
        />
      </div>

      {active ? (
        <div
          className="mt-4"
          role="progressbar"
          aria-label={STATUS_COPY[job.status][language]}
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={Math.min(current, total)}
        >
          <div className="h-2 overflow-hidden rounded-full bg-sky-100">
            <div
              className="h-full rounded-full bg-sky-500 transition-[width] duration-500"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <p className="mt-2 text-xs leading-5 text-slate-500">
            {language === "kk"
              ? "Жұмыс серверде жалғасады. Бетті жабуға болады."
              : "Работа продолжается на сервере. Страницу можно закрыть."}
          </p>
        </div>
      ) : (
        <p className="mt-4 text-xs leading-5 text-slate-500">
          {generationExpiryCopy(job, language)}
        </p>
      )}

      <div className="mt-auto grid grid-cols-2 gap-2 pt-5">
        <Link
          href={openHref}
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-3 text-sm font-bold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
        >
          {language === "kk" ? "Ашу" : "Открыть"}
        </Link>
        <button
          type="button"
          onClick={() => void download()}
          disabled={!downloadable || downloading}
          className="min-h-11 rounded-xl bg-slate-950 px-3 text-sm font-bold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
        >
          {downloading
            ? language === "kk" ? "Жүктелуде…" : "Скачиваем…"
            : language === "kk" ? "Жүктеу" : "Скачать"}
        </button>
      </div>
    </article>
  );
}
