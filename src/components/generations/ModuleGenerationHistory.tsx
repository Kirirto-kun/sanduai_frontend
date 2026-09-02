"use client";

import { useMemo, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { useLanguage } from "../../i18n/LanguageContext";
import { listGenerationJobs, type GenerationJobSummary } from "../../lib/api";
import {
  filterGenerationJobsByKind,
  selectGenerationHistoryPage,
} from "../../lib/generation-history";
import { teacherFacingErrorMessage } from "../../lib/teacher-facing-error";
import { generationJobsQueryKey } from "./GenerationCenter";
import { GenerationMaterialCard } from "./GenerationMaterialCard";


export type ModuleGenerationHistoryProps = {
  kinds: readonly string[];
  title?: { ru: string; kk: string };
  limit?: number;
  onDownload?: (job: GenerationJobSummary) => Promise<void>;
};


const HISTORY_API_PAGE_SIZE = 100;


async function listKindHistory(kind: string, wanted: number) {
  const items: GenerationJobSummary[] = [];
  let offset = 0;
  let hasMore = true;

  while (items.length < wanted && hasMore) {
    const requested = Math.min(HISTORY_API_PAGE_SIZE, wanted - items.length);
    const page = await listGenerationJobs({ kind, limit: requested, offset });
    items.push(...page.items);

    const nextOffset = page.next_offset ?? offset + page.items.length;
    hasMore = page.has_more
      ?? (page.total !== undefined
        ? nextOffset < page.total
        : page.items.length === requested);
    if (page.items.length === 0 || nextOffset <= offset) break;
    offset = nextOffset;
  }

  return { items, hasMore };
}


export function ModuleGenerationHistory({
  kinds,
  title = { ru: "Мои материалы", kk: "Менің материалдарым" },
  limit = 6,
  onDownload,
}: ModuleGenerationHistoryProps) {
  const { language } = useLanguage();
  const [actionError, setActionError] = useState<string | null>(null);
  const [visiblePages, setVisiblePages] = useState(1);
  const stableKinds = useMemo(() => [...new Set(kinds)].sort(), [kinds]);
  const pageSize = Math.max(1, Math.trunc(limit));
  const visibleLimit = pageSize * visiblePages;
  const jobs = useQuery({
    queryKey: [...generationJobsQueryKey, "module", stableKinds.join(","), visibleLimit],
    queryFn: async () => {
      const pages = await Promise.all(
        stableKinds.map((kind) => listKindHistory(kind, visibleLimit + 1)),
      );
      return selectGenerationHistoryPage(
        pages.flatMap((page) => page.items),
        visibleLimit,
        pages.some((page) => page.hasMore),
      );
    },
    enabled: stableKinds.length > 0,
    placeholderData: keepPreviousData,
    staleTime: 1_000,
    retry: 2,
    refetchOnReconnect: true,
    refetchOnWindowFocus: true,
    refetchInterval: (query) =>
      query.state.data?.items.some((job) =>
        ["queued", "running", "settling", "refunding"].includes(job.status),
      )
        ? 2_500
        : 30_000,
  });
  const items = filterGenerationJobsByKind(jobs.data?.items ?? [], stableKinds);

  if (!jobs.isLoading && !jobs.isError && items.length === 0) return null;

  return (
    <section className="mt-8 rounded-3xl border border-white/70 bg-white/80 p-5 shadow-sm sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--primary)]">
            {language === "kk" ? "Тарих" : "История"}
          </p>
          <h2 className="mt-1 text-xl font-bold text-slate-950">{title[language]}</h2>
        </div>
      </div>

      {actionError ? (
        <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
          {actionError}
        </div>
      ) : null}

      {jobs.isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3" aria-label={language === "kk" ? "Жүктелуде" : "Загрузка"}>
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-48 animate-pulse rounded-3xl bg-slate-100" />
          ))}
        </div>
      ) : jobs.isError ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p>{teacherFacingErrorMessage(jobs.error, language)}</p>
          <button
            type="button"
            onClick={() => void jobs.refetch()}
            className="mt-3 font-bold underline underline-offset-4"
          >
            {language === "kk" ? "Қайта жүктеу" : "Попробовать снова"}
          </button>
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((job) => (
              <GenerationMaterialCard
                key={job.id}
                job={job}
                language={language}
                onDownload={onDownload}
                onActionError={(error) => setActionError(teacherFacingErrorMessage(error, language))}
              />
            ))}
          </div>
          {jobs.data?.hasMore ? (
            <div className="mt-5 flex justify-center">
              <button
                type="button"
                onClick={() => setVisiblePages((current) => current + 1)}
                disabled={jobs.isFetching}
                className="min-h-11 rounded-xl border border-slate-300 bg-white px-5 text-sm font-bold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 disabled:cursor-wait disabled:opacity-60"
              >
                {jobs.isFetching
                  ? language === "kk" ? "Жүктелуде…" : "Загружаем…"
                  : language === "kk" ? "Тағы көрсету" : "Показать ещё"}
              </button>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
