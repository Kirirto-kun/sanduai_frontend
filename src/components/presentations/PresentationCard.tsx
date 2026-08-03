"use client";

import Link from "next/link";
import { useLanguage } from "@/i18n/LanguageContext";
import type { PresentationProject } from "@/types/presentations";
import { getPresentationCopy } from "./copy";
import { isLegacyReadOnly, isLegacySourceMissing } from "./legacy-utils";
import { ModeBadge, ProjectStatusBadge } from "./PresentationUI";

function projectHref(project: PresentationProject) {
  const status = project.status.toLowerCase();
  if (status === "draft" || status === "planning" || status === "plan_ready" || status === "awaiting_approval") {
    return `/dashboard/ai/presentations/outline/${project.id}`;
  }
  return `/dashboard/ai/presentations/editor/${project.id}`;
}

export default function PresentationCard({
  presentation,
  onDelete,
  deleting = false,
}: {
  presentation: PresentationProject;
  onDelete: (presentation: PresentationProject) => void;
  deleting?: boolean;
}) {
  const { language } = useLanguage();
  const copy = getPresentationCopy(language);
  const locale = language === "kk" ? "kk-KZ" : "ru-RU";
  const date = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric" }).format(
    new Date(presentation.updated_at ?? presentation.created_at),
  );
  const slideCount = presentation.slide_count ?? presentation.slides?.length ?? presentation.active_plan?.slides.length ?? 0;
  const completed = presentation.slides?.filter((slide) => ["ready", "accepted", "needs_review"].includes(slide.status)).length ?? 0;
  const isInProgress = ["planning", "queued", "generating"].includes(presentation.status);
  const legacyReadOnly = isLegacyReadOnly(presentation);
  const sourceMissing = isLegacySourceMissing(presentation);
  const legacyCopy = language === "kk"
    ? {
        archive: "Ескі презентациялар мұрағаты",
        open: "Мұрағатты ашу",
        sourceMissing: "Бастапқы файл көшіру кезінде табылмады",
        imported: "Бұрынғы сервистен сақталған түпнұсқа",
      }
    : {
        archive: "Архив старых презентаций",
        open: "Открыть архив",
        sourceMissing: "Исходный файл не найден при переносе",
        imported: "Сохранённый оригинал из прежнего сервиса",
      };

  return (
    <article className="group flex min-h-64 flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white/90 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-xl">
      <div
        className={`h-2 ${
          legacyReadOnly
            ? "bg-gradient-to-r from-slate-400 via-slate-300 to-amber-300"
            : presentation.mode === "creative"
            ? "bg-gradient-to-r from-violet-500 via-fuchsia-400 to-amber-300"
            : "bg-gradient-to-r from-sky-500 via-cyan-400 to-emerald-400"
        }`}
      />
      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap items-center gap-2">
          {legacyReadOnly ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-800 ring-1 ring-amber-200">
              <span aria-hidden="true">▣</span>
              {legacyCopy.archive}
            </span>
          ) : (
            <ModeBadge mode={presentation.mode} />
          )}
          <ProjectStatusBadge status={presentation.status} />
        </div>
        <h3 className="mt-4 line-clamp-2 text-lg font-bold leading-snug text-slate-950">
          {presentation.title || copy.editorTitle}
        </h3>
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
          {legacyReadOnly
            ? sourceMissing
              ? legacyCopy.sourceMissing
              : [presentation.subject, presentation.grade].filter(Boolean).join(" · ") || legacyCopy.imported
            : [presentation.subject, presentation.grade].filter(Boolean).join(" · ") ||
              (presentation.mode === "creative" ? copy.creativeDescription : copy.classicDescription)}
        </p>

        {isInProgress && slideCount > 0 && (
          <div className="mt-4" aria-label={`${copy.generatedOf}: ${completed} / ${slideCount}`}>
            <div className="flex justify-between text-[11px] font-semibold text-slate-500">
              <span>{copy.generationProgress}</span>
              <span>{completed}/{slideCount}</span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-sky-500 to-emerald-400 transition-all"
                style={{ width: `${Math.round((completed / slideCount) * 100)}%` }}
              />
            </div>
          </div>
        )}

        <div className="mt-auto flex items-end justify-between gap-3 pt-5">
          <div className="text-xs text-slate-400">
            <p>{date}</p>
            <p className="mt-0.5">
              {sourceMissing ? legacyCopy.sourceMissing : `${slideCount} ${copy.slides}`}
            </p>
          </div>
          <div className="flex gap-2">
            {!legacyReadOnly && (
              <button
                type="button"
                onClick={() => onDelete(presentation)}
                disabled={deleting}
                aria-label={`${copy.delete}: ${presentation.title}`}
                className="min-h-11 min-w-11 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 disabled:opacity-50"
              >
                <span aria-hidden="true">⌫</span>
              </button>
            )}
            <Link
              href={projectHref(presentation)}
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
            >
              {legacyReadOnly ? legacyCopy.open : presentation.status === "ready" ? copy.open : copy.continue}
              <span className="ml-2" aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
