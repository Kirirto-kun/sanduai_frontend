"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useLanguage } from "@/i18n/LanguageContext";
import { teacherFacingErrorMessage } from "@/lib/teacher-facing-error";
import { ApiError, getLibraryCategories, getLibraryContent, getLibrarySubjects } from "../api";
import { MATERIAL_TYPE_CONFIG, SEGMENT_LABELS, localize } from "../config";
import {
  CONTENT_SEGMENTS,
  MATERIAL_TYPES,
  type ContentItem,
  type ContentListParams,
  type ContentSegment,
  type MaterialType,
} from "../types";
import { CatalogFilters } from "./CatalogFilters";
import { ContentCard } from "./ContentCard";
import { ContentDetailsDialog } from "./ContentDetailsDialog";
import { Pagination } from "./Pagination";

const DEFAULT_PAGE_SIZE = 24;

function positiveInteger(value: string | null, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function isSegment(value: string | null): value is ContentSegment {
  return Boolean(value && CONTENT_SEGMENTS.includes(value as ContentSegment));
}

function isMaterialType(value: string | null): value is MaterialType {
  return Boolean(value && MATERIAL_TYPES.includes(value as MaterialType));
}

export function ContentLibraryPage() {
  const { language } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryString = searchParams.toString();
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);

  const params = useMemo<ContentListParams>(() => {
    const current = new URLSearchParams(queryString);
    const segment = current.get("segment");
    const type = current.get("type");
    const grade = current.get("grade");
    const sort = current.get("sort");
    return {
      q: current.get("q")?.trim() || undefined,
      segment: isSegment(segment) ? segment : undefined,
      type: isMaterialType(type) ? type : undefined,
      grade: grade ? positiveInteger(grade, 0) || undefined : undefined,
      subject: current.get("subject")?.trim() || undefined,
      category: current.get("category")?.trim() || undefined,
      page: positiveInteger(current.get("page"), 1),
      page_size: Math.min(48, positiveInteger(current.get("page_size"), DEFAULT_PAGE_SIZE)),
      sort: sort === "newest" ? sort : "newest",
    };
  }, [queryString]);

  const contentQuery = useQuery({
    queryKey: ["library-content", params],
    queryFn: ({ signal }) => getLibraryContent(params, signal),
    placeholderData: keepPreviousData,
  });
  const categoriesQuery = useQuery({
    queryKey: ["library-content-categories"],
    queryFn: ({ signal }) => getLibraryCategories(signal),
    staleTime: 10 * 60 * 1000,
  });
  const subjectsQuery = useQuery({
    queryKey: ["library-content-subjects"],
    queryFn: ({ signal }) => getLibrarySubjects(signal),
    staleTime: 10 * 60 * 1000,
  });

  const updateUrl = useCallback(
    (changes: Partial<ContentListParams>) => {
      const next = new URLSearchParams(queryString);
      Object.entries(changes).forEach(([key, value]) => {
        if (value === undefined || value === "" || (key === "page" && Number(value) === 1)) {
          next.delete(key);
        } else {
          next.set(key, String(value));
        }
      });
      const nextQuery = next.toString();
      router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
    },
    [pathname, queryString, router],
  );

  useEffect(() => {
    const isVisualType = params.type === "visual_aid" || params.type === "safety_visual_aid";
    if (params.segment === "library" && params.type && params.type !== "event") {
      updateUrl({ type: undefined, grade: undefined, page: 1 });
    } else if (params.segment && params.segment !== "school" && params.grade) {
      updateUrl({ grade: undefined, page: 1 });
    } else if (isVisualType && (params.grade ?? 0) > 4) {
      updateUrl({ grade: undefined, page: 1 });
    }
  }, [params.grade, params.segment, params.type, updateUrl]);

  useEffect(() => {
    const result = contentQuery.data;
    if (!result || contentQuery.isPlaceholderData) return;
    const lastPage = Math.max(1, result.total_pages);
    if ((params.page ?? 1) > lastPage) updateUrl({ page: lastPage });
  }, [contentQuery.data, contentQuery.isPlaceholderData, params.page, updateUrl]);

  const currentType = params.type ? MATERIAL_TYPE_CONFIG[params.type] : null;
  const title = currentType
    ? localize(currentType.label, language)
    : language === "kk"
      ? "Дайын материалдар"
      : "Готовые материалы";
  const subtitle = currentType
    ? localize(currentType.description, language)
    : language === "kk"
      ? "Мектепке, балабақшаға және кітапханаға арналған материалдарды іздеңіз."
      : "Ищите материалы для школы, детского сада и библиотеки во всём каталоге.";
  const result = contentQuery.data;

  return (
    <div className="mx-auto max-w-[1440px] space-y-5">
      <header className="rounded-3xl border border-white/70 bg-white/90 px-5 py-6 shadow-sm sm:px-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-orange-700">
              <span>{currentType?.icon ?? "📚"}</span>
              {params.segment && <span>{localize(SEGMENT_LABELS[params.segment], language)}</span>}
              {params.grade && <span>· {params.grade} {language === "kk" ? "сынып" : "класс"}</span>}
            </div>
            <h1 className="mt-1 text-2xl font-semibold text-slate-900 sm:text-3xl">{title}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600">{subtitle}</p>
          </div>
          {result && (
            <p aria-live="polite" className="shrink-0 text-sm font-medium text-slate-500">
              {language === "kk" ? "Табылды" : "Найдено"}: <span className="font-semibold text-slate-900">{result.total}</span>
            </p>
          )}
        </div>
      </header>

      <CatalogFilters
        key={`${params.q ?? ""}|${params.subject ?? ""}`}
        params={params}
        categories={categoriesQuery.data ?? []}
        categoriesLoading={categoriesQuery.isLoading}
        subjects={subjectsQuery.data ?? []}
        subjectsLoading={subjectsQuery.isLoading}
        language={language}
        onChange={updateUrl}
      />

      {contentQuery.isError && (
        <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          <p className="font-semibold">
            {contentQuery.error instanceof ApiError && contentQuery.error.status === 403
              ? language === "kk" ? "Материалдарға қол жеткізу үшін белсенді жазылым қажет." : "Для доступа к материалам нужна активная подписка."
              : language === "kk" ? "Материалдарды жүктеу мүмкін болмады." : "Не удалось загрузить материалы."}
          </p>
          {!(contentQuery.error instanceof ApiError && contentQuery.error.status === 403) && (
            <p className="mt-1 text-xs">
              {teacherFacingErrorMessage(contentQuery.error, language, {
                fallback: language === "kk"
                  ? "Материалдарды жүктеу мүмкін болмады. Қайталап көріңіз."
                  : "Не удалось загрузить материалы. Попробуйте ещё раз.",
              })}
            </p>
          )}
          <button type="button" onClick={() => contentQuery.refetch()} className="mt-3 rounded-lg bg-red-700 px-3 py-2 text-xs font-semibold text-white">
            {language === "kk" ? "Қайталау" : "Повторить"}
          </button>
        </div>
      )}

      {contentQuery.isLoading ? (
        <div role="status" aria-label={language === "kk" ? "Жүктелуде" : "Загрузка"} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }, (_, index) => (
            <div key={index} className="overflow-hidden rounded-2xl border border-white/70 bg-white/80 shadow-sm">
              <div className="aspect-[16/10] animate-pulse bg-slate-200" />
              <div className="space-y-3 p-4">
                <div className="h-3 w-1/3 animate-pulse rounded bg-slate-200" />
                <div className="h-5 w-5/6 animate-pulse rounded bg-slate-200" />
                <div className="h-3 w-full animate-pulse rounded bg-slate-100" />
              </div>
            </div>
          ))}
        </div>
      ) : result && result.items.length > 0 ? (
        <>
          <div className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ${contentQuery.isFetching ? "opacity-70" : ""}`}>
            {result.items.map((item) => (
              <ContentCard key={item.id} item={item} onOpen={setSelectedItem} />
            ))}
          </div>
          <div className="rounded-2xl border border-white/70 bg-white/80 px-3 py-4 shadow-sm">
            <Pagination
              page={result.page}
              totalPages={result.total_pages}
              language={language}
              onPageChange={(page) => {
                updateUrl({ page });
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />
          </div>
        </>
      ) : !contentQuery.isError ? (
        <div className="rounded-3xl border border-white/70 bg-white/90 px-6 py-14 text-center shadow-sm">
          <div className="text-5xl" aria-hidden="true">🔎</div>
          <h2 className="mt-4 text-lg font-semibold text-slate-900">
            {language === "kk" ? "Материалдар табылмады" : "Материалы не найдены"}
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            {language === "kk" ? "Іздеу сөзін немесе сүзгілерді өзгертіп көріңіз." : "Попробуйте изменить запрос или фильтры."}
          </p>
        </div>
      ) : null}

      {selectedItem && <ContentDetailsDialog item={selectedItem} onClose={() => setSelectedItem(null)} />}
    </div>
  );
}
