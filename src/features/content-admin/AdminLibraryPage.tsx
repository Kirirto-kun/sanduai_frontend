"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { teacherFacingErrorMessage } from "@/lib/teacher-facing-error";
import {
  archiveAdminLibraryContent,
  backfillLegacyLibrary,
  getAdminLibraryContent,
  getLibraryCategories,
  getLibrarySubjects,
  restoreAdminLibraryContent,
  retryLegacyLibraryContent,
} from "@/features/content-library/api";
import { MATERIAL_TYPE_CONFIG, SEGMENT_LABELS, localize } from "@/features/content-library/config";
import { CatalogFilters } from "@/features/content-library/components/CatalogFilters";
import { ContentPreview } from "@/features/content-library/components/ContentPreview";
import { Pagination } from "@/features/content-library/components/Pagination";
import type {
  ContentItem,
  ContentListParams,
  LegacyBackfillResponse,
  LegacyBackfillStats,
} from "@/features/content-library/types";
import { ContentEditorForm } from "./ContentEditorForm";

type EditorState = "new" | ContentItem | null;
type LibraryView = "active" | "drafts" | "archived";
type Notice = { kind: "success" | "warning"; text: string };

const VIEW_FILTERS: Record<LibraryView, Pick<ContentListParams, "archived" | "published">> = {
  active: { archived: false, published: true },
  drafts: { archived: false, published: false },
  archived: { archived: true, published: undefined },
};

function backfillEntries(response: LegacyBackfillResponse): Array<[string, LegacyBackfillStats]> {
  return Object.entries(response).filter(
    (entry): entry is [string, LegacyBackfillStats] =>
      typeof entry[1] === "object" &&
      entry[1] !== null &&
      typeof entry[1].processed === "number" &&
      typeof entry[1].succeeded === "number" &&
      typeof entry[1].failed === "number" &&
      Array.isArray(entry[1].failed_ids),
  );
}

export function AdminLibraryPage() {
  const { language } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [view, setView] = useState<LibraryView>("active");
  const [filters, setFilters] = useState<ContentListParams>({
    page: 1,
    page_size: 20,
    sort: "newest",
    ...VIEW_FILTERS.active,
  });
  const [editor, setEditor] = useState<EditorState>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [legacyType, setLegacyType] = useState<"all" | "materials" | "visuals">("all");

  useEffect(() => {
    if (!authLoading && user?.role !== "admin") router.replace("/dashboard");
  }, [authLoading, router, user]);

  const isAdmin = user?.role === "admin";
  const listQuery = useQuery({
    queryKey: ["admin-library-content", filters],
    queryFn: ({ signal }) => getAdminLibraryContent(filters, signal),
    placeholderData: keepPreviousData,
    enabled: isAdmin,
  });
  const categoriesQuery = useQuery({
    queryKey: ["library-content-categories"],
    queryFn: ({ signal }) => getLibraryCategories(signal),
    staleTime: 10 * 60 * 1000,
    enabled: isAdmin,
  });
  const subjectsQuery = useQuery({
    queryKey: ["library-content-subjects"],
    queryFn: ({ signal }) => getLibrarySubjects(signal),
    staleTime: 10 * 60 * 1000,
    enabled: isAdmin,
  });

  const stepBackFromLastRow = () => {
    if ((filters.page ?? 1) > 1 && listQuery.data?.items.length === 1) {
      setFilters((current) => ({ ...current, page: Math.max(1, (current.page ?? 1) - 1) }));
    }
  };

  const invalidateContent = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["admin-library-content"] }),
      queryClient.invalidateQueries({ queryKey: ["library-content"] }),
    ]);
  };

  const archiveMutation = useMutation({
    mutationFn: archiveAdminLibraryContent,
    onSuccess: async () => {
      stepBackFromLastRow();
      setNotice({ kind: "success", text: language === "kk" ? "Материал мұрағатқа жіберілді." : "Материал перемещён в архив." });
      await invalidateContent();
    },
  });
  const restoreMutation = useMutation({
    mutationFn: restoreAdminLibraryContent,
    onSuccess: async (item) => {
      stepBackFromLastRow();
      setNotice({
        kind: item.is_active ? "success" : "warning",
        text: item.is_active
          ? language === "kk" ? "Материал қалпына келтіріліп, жарияланды." : "Материал восстановлен и опубликован."
          : language === "kk" ? "Материал жоба ретінде қалпына келтірілді — оны толықтыру керек." : "Материал восстановлен как черновик — его нужно дополнить.",
      });
      await invalidateContent();
    },
  });
  const retryMutation = useMutation({
    mutationFn: retryLegacyLibraryContent,
    onSuccess: async (item) => {
      setNotice({
        kind: item.is_active ? "success" : "warning",
        text: item.is_active
          ? language === "kk" ? "Ескі файл қайта өңделді." : "Старый файл успешно обработан."
          : language === "kk" ? "Файл өңделді, бірақ материалды толықтыру керек." : "Файл обработан, но материал ещё нужно дополнить.",
      });
      await invalidateContent();
    },
  });
  const backfillMutation = useMutation({
    mutationFn: (type: "all" | "materials" | "visuals") => backfillLegacyLibrary(type, 1),
    onSuccess: async (response) => {
      const totals = backfillEntries(response).reduce(
        (sum, [, stats]) => ({ processed: sum.processed + stats.processed, failed: sum.failed + stats.failed }),
        { processed: 0, failed: 0 },
      );
      setNotice({
        kind: totals.failed > 0 ? "warning" : "success",
        text: language === "kk"
          ? `Импорт аяқталды: ${totals.processed} өңделді, ${totals.failed} қате.`
          : `Импорт завершён: обработано ${totals.processed}, ошибок ${totals.failed}.`,
      });
      await invalidateContent();
    },
  });

  if (authLoading || !isAdmin) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center" role="status">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-orange-500 border-r-transparent" />
      </div>
    );
  }

  const updateFilters = (changes: Partial<ContentListParams>) => {
    setFilters((current) => ({ ...current, ...changes, page_size: 20 }));
  };

  const changeView = (nextView: LibraryView) => {
    setView(nextView);
    setFilters((current) => ({ ...current, ...VIEW_FILTERS[nextView], page: 1 }));
  };

  const archive = (item: ContentItem) => {
    const confirmed = window.confirm(
      language === "kk"
        ? `«${item.title}» материалын мұрағатқа жіберу керек пе? Ол пайдаланушылар каталогынан жасырылады.`
        : `Переместить «${item.title}» в архив? Материал исчезнет из пользовательского каталога.`,
    );
    if (confirmed) archiveMutation.mutate(item.id);
  };

  if (editor) {
    return (
      <div className="mx-auto max-w-5xl">
        <div className="rounded-3xl border border-white/70 bg-white/95 p-5 shadow-lg sm:p-7">
          <ContentEditorForm
            key={editor === "new" ? "new" : editor.id}
            item={editor === "new" ? null : editor}
            categories={categoriesQuery.data ?? []}
            categoriesLoading={categoriesQuery.isLoading}
            subjects={subjectsQuery.data ?? []}
            subjectsLoading={subjectsQuery.isLoading}
            onCancel={() => setEditor(null)}
            onSaved={async (savedItem, saveMode) => {
              const remainsInView = view === "archived"
                ? savedItem.is_archived
                : view === "active"
                  ? savedItem.is_active
                  : !savedItem.is_active && !savedItem.is_archived;
              if (editor !== "new" && !remainsInView) stepBackFromLastRow();
              if (saveMode === "close") setEditor(null);
              const errors = savedItem.publication_errors ?? [];
              setNotice({
                kind: savedItem.is_active ? "success" : "warning",
                text: savedItem.is_active
                  ? language === "kk" ? `«${savedItem.title}» материалы жарияланды.` : `Материал «${savedItem.title}» опубликован.`
                  : language === "kk"
                    ? `«${savedItem.title}» жоба ретінде сақталды.${errors.length ? ` Толықтыру керек: ${errors.join("; ")}` : ""}`
                    : `Материал «${savedItem.title}» сохранён как черновик.${errors.length ? ` Нужно исправить: ${errors.join("; ")}` : ""}`,
              });
              await invalidateContent();
            }}
          />
        </div>
      </div>
    );
  }

  const result = listQuery.data;
  const actionError = archiveMutation.error ?? restoreMutation.error ?? retryMutation.error;

  return (
    <div className="mx-auto max-w-[1440px] space-y-5">
      <header className="rounded-3xl border border-white/70 bg-white/95 px-5 py-6 shadow-sm sm:px-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-orange-700">SanduAI Admin</p>
            <h1 className="mt-1 text-2xl font-semibold text-slate-900 sm:text-3xl">
              {language === "kk" ? "Дайын материалдар кітапханасы" : "Библиотека готовых материалов"}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600">
              {language === "kk"
                ? "Материалдарды бір жерден сақтаңыз, жариялаңыз және мұрағаттаңыз."
                : "Сохраняйте, публикуйте и архивируйте материалы для всех разделов в одном месте."}
            </p>
          </div>
          <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
            <Link
              href="/dashboard/admin/library/taxonomy"
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-center text-sm font-semibold text-slate-700 transition hover:border-orange-300 hover:text-orange-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2"
            >
              {language === "kk" ? "Санаттар мен пәндер" : "Категории и предметы"}
            </Link>
            <button
              type="button"
              onClick={() => {
                setNotice(null);
                setEditor("new");
              }}
              className="rounded-xl bg-[color:var(--primary)] px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2"
            >
              + {language === "kk" ? "Материал қосу" : "Добавить материал"}
            </button>
          </div>
        </div>
      </header>

      {notice && (
        <div
          role="status"
          className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-sm font-medium ${
            notice.kind === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-amber-200 bg-amber-50 text-amber-800"
          }`}
        >
          <span>{notice.text}</span>
          <button type="button" onClick={() => setNotice(null)} aria-label={language === "kk" ? "Хабарламаны жабу" : "Закрыть уведомление"} className="rounded p-1 hover:bg-black/5">×</button>
        </div>
      )}

      <details className="rounded-2xl border border-blue-200 bg-blue-50/80 px-4 py-3 text-sm text-blue-900">
        <summary className="cursor-pointer font-semibold">
          {language === "kk" ? "Ескі материалдарды қауіпсіз импорттау" : "Безопасный импорт старых материалов"}
        </summary>
        <div className="mt-3 space-y-3">
          <p className="text-xs leading-relaxed text-blue-800">
            {language === "kk"
              ? "Әр іске қосу бір жазбаны қауіпсіз өңдейді. Толық емес материалдар жоба болып қалады; өңделмеген жазбалар біткенше импортты қайталауға болады."
              : "Один запуск безопасно обрабатывает одну запись. Неполные материалы остаются черновиками; повторяйте импорт, пока необработанных записей не останется."}
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <select value={legacyType} onChange={(event) => setLegacyType(event.target.value as typeof legacyType)} className="rounded-xl border border-blue-200 bg-white px-3 py-2 text-sm">
              <option value="all">{language === "kk" ? "Барлық ескі материалдар" : "Все старые материалы"}</option>
              <option value="materials">{language === "kk" ? "Презентациялар" : "Презентации"}</option>
              <option value="visuals">{language === "kk" ? "Көрнекіліктер" : "Наглядные материалы"}</option>
            </select>
            <button type="button" disabled={backfillMutation.isPending} onClick={() => backfillMutation.mutate(legacyType)} className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
              {backfillMutation.isPending
                ? language === "kk" ? "Импорт орындалуда…" : "Идёт импорт…"
                : language === "kk" ? "Келесі жазбаны импорттау" : "Импортировать следующую запись"}
            </button>
          </div>
          {backfillMutation.data && (
            <div className="grid gap-2 sm:grid-cols-2">
              {backfillEntries(backfillMutation.data).map(([source, stats]) => (
                <div key={source} className="rounded-xl bg-white p-3 text-xs shadow-sm">
                  <p className="font-semibold">{source === "materials" ? (language === "kk" ? "Презентациялар" : "Презентации") : (language === "kk" ? "Көрнекіліктер" : "Наглядные материалы")}</p>
                  <p className="mt-1 text-slate-600">{language === "kk" ? "Өңделді" : "Обработано"}: {stats.processed} · {language === "kk" ? "Сәтті" : "Успешно"}: {stats.succeeded} · {language === "kk" ? "Қате" : "Ошибок"}: {stats.failed}</p>
                  {stats.failed_ids.length > 0 && <p className="mt-1 break-all text-red-700">ID: {stats.failed_ids.join(", ")}</p>}
                </div>
              ))}
            </div>
          )}
          {backfillMutation.isError && <p role="alert" className="text-xs font-medium text-red-700">{teacherFacingErrorMessage(backfillMutation.error, language, {
            fallback: language === "kk" ? "Импорт қатесі." : "Ошибка импорта.",
          })}</p>}
        </div>
      </details>

      <div className="flex overflow-x-auto rounded-2xl border border-slate-200 bg-white p-1 shadow-sm" role="tablist" aria-label={language === "kk" ? "Материал күйі" : "Статус материалов"}>
        {(["active", "drafts", "archived"] as LibraryView[]).map((value) => {
          const label = value === "active"
            ? language === "kk" ? "Жарияланған" : "Опубликованные"
            : value === "drafts"
              ? language === "kk" ? "Жобалар" : "Черновики"
              : language === "kk" ? "Мұрағат" : "Архив";
          return (
            <button key={value} type="button" role="tab" aria-selected={view === value} onClick={() => changeView(value)} className={`whitespace-nowrap rounded-xl px-4 py-2 text-sm font-semibold transition ${view === value ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"}`}>
              {label}
            </button>
          );
        })}
      </div>

      <CatalogFilters
        key={`${filters.q ?? ""}|${filters.subject ?? ""}`}
        params={filters}
        categories={categoriesQuery.data ?? []}
        categoriesLoading={categoriesQuery.isLoading}
        subjects={subjectsQuery.data ?? []}
        subjectsLoading={subjectsQuery.isLoading}
        language={language}
        onChange={updateFilters}
      />

      {actionError && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {teacherFacingErrorMessage(actionError, language, {
            fallback: language === "kk" ? "Әрекетті орындау мүмкін болмады." : "Не удалось выполнить действие.",
          })}
        </div>
      )}

      <section className="overflow-hidden rounded-3xl border border-white/70 bg-white/95 shadow-sm" aria-labelledby="admin-library-list-heading">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-4 sm:px-6">
          <h2 id="admin-library-list-heading" className="text-lg font-semibold text-slate-900">{language === "kk" ? "Материалдар" : "Материалы"}</h2>
          {result && <span className="text-sm text-slate-500">{language === "kk" ? "Барлығы" : "Всего"}: {result.total}</span>}
        </div>

        {listQuery.isError && (
          <div role="alert" className="m-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <p>{teacherFacingErrorMessage(listQuery.error, language, {
              fallback: language === "kk" ? "Тізімді жүктеу мүмкін болмады." : "Не удалось загрузить список.",
            })}</p>
            <button type="button" onClick={() => listQuery.refetch()} className="mt-2 font-semibold underline">{language === "kk" ? "Қайталау" : "Повторить"}</button>
          </div>
        )}

        {listQuery.isLoading ? (
          <div className="space-y-3 p-4 sm:p-6" role="status">
            {Array.from({ length: 5 }, (_, index) => <div key={index} className="h-24 animate-pulse rounded-2xl bg-slate-100" />)}
          </div>
        ) : result && result.items.length > 0 ? (
          <div className={`divide-y divide-slate-100 ${listQuery.isFetching ? "opacity-70" : ""}`}>
            {result.items.map((item) => {
              const config = MATERIAL_TYPE_CONFIG[item.material_type];
              const assetCount = Object.values(item.asset_counts ?? {}).reduce((sum, count) => sum + (count ?? 0), 0);
              const retryRecommended = Boolean(
                item.legacy_source &&
                  (assetCount === 0 || ["missing", "pending", "failed", "placeholder"].includes(item.preview_status)),
              );
              return (
                <article key={item.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:px-6">
                  <div className="w-full shrink-0 sm:w-32">
                    <ContentPreview src={item.preview_url} alt="" materialType={item.material_type} previewStatus={item.preview_status} language={language} sizes="128px" className="aspect-video w-full rounded-xl border border-slate-200" authenticated />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold text-orange-700">{config.icon} {localize(config.label, language)}</span>
                      <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${item.is_archived ? "bg-slate-200 text-slate-600" : item.is_active ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                        {item.is_archived ? (language === "kk" ? "Мұрағатта" : "В архиве") : item.is_active ? (language === "kk" ? "Жарияланған" : "Опубликован") : (language === "kk" ? "Жоба" : "Черновик")}
                      </span>
                      {item.legacy_source && <span className="rounded-full bg-blue-100 px-2 py-1 text-[10px] font-semibold text-blue-700">Legacy</span>}
                      {item.needs_taxonomy && <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-semibold text-amber-800">{language === "kk" ? "Толықтыру керек" : "Нужно дополнить"}</span>}
                    </div>
                    <h3 className="mt-1 truncate text-base font-semibold text-slate-900" title={item.title}>{item.title}</h3>
                    <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] text-slate-500">
                      {item.segments.map((segment) => <span key={segment} className="rounded bg-slate-100 px-2 py-1">{localize(SEGMENT_LABELS[segment], language)}</span>)}
                      {item.grades.length > 0 && <span className="rounded bg-slate-100 px-2 py-1">{item.grades.join(", ")} {language === "kk" ? "сынып" : "класс"}</span>}
                      <span className="rounded bg-slate-100 px-2 py-1">{assetCount} {language === "kk" ? "файл" : "файлов"}</span>
                      {item.formats.length > 0 && <span className="rounded bg-slate-100 px-2 py-1 uppercase">{item.formats.join(" · ")}</span>}
                    </div>
                    {(item.publication_errors?.length ?? 0) > 0 && (
                      <details className="mt-2 text-xs text-amber-800">
                        <summary className="cursor-pointer font-semibold">{language === "kk" ? "Неліктен жарияланбады?" : "Почему не опубликован?"}</summary>
                        <ul className="mt-1 list-disc pl-5">{item.publication_errors?.map((error) => <li key={error}>{error}</li>)}</ul>
                      </details>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2 sm:max-w-56 sm:justify-end">
                    <button type="button" onClick={() => setEditor(item)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-orange-300 hover:text-orange-700">
                      {language === "kk" ? "Өңдеу" : "Изменить"}
                    </button>
                    {retryRecommended && (
                      <button type="button" disabled={retryMutation.isPending} onClick={() => retryMutation.mutate(item.id)} className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-100 disabled:opacity-50">
                        {retryMutation.isPending && retryMutation.variables === item.id
                          ? language === "kk" ? "Өңделуде…" : "Обработка…"
                          : assetCount === 0
                            ? language === "kk" ? "Импортты қайталау" : "Повторить импорт"
                            : language === "kk" ? "Превьюді жаңарту" : "Обновить превью"}
                      </button>
                    )}
                    {item.is_archived ? (
                      <button type="button" disabled={restoreMutation.isPending} onClick={() => restoreMutation.mutate(item.id)} className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50">
                        {restoreMutation.isPending && restoreMutation.variables === item.id ? (language === "kk" ? "Күтіңіз…" : "Подождите…") : (language === "kk" ? "Қалпына келтіру" : "Восстановить")}
                      </button>
                    ) : (
                      <button type="button" disabled={archiveMutation.isPending} onClick={() => archive(item)} className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-50">
                        {archiveMutation.isPending && archiveMutation.variables === item.id ? (language === "kk" ? "Күтіңіз…" : "Подождите…") : (language === "kk" ? "Мұрағатқа" : "В архив")}
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        ) : !listQuery.isError ? (
          <div className="px-6 py-14 text-center text-sm text-slate-500">
            <div className="text-4xl" aria-hidden="true">📭</div>
            <p className="mt-3">{language === "kk" ? "Материалдар табылмады." : "Материалы не найдены."}</p>
          </div>
        ) : null}

        {result && result.total_pages > 1 && (
          <div className="border-t border-slate-200 px-3 py-4">
            <Pagination page={result.page} totalPages={result.total_pages} language={language} onPageChange={(page) => updateFilters({ page })} />
          </div>
        )}
      </section>
    </div>
  );
}
