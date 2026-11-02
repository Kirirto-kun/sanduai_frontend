"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useInfiniteQuery } from "@tanstack/react-query";

import { GenerationMaterialCard } from "../../../components/generations/GenerationMaterialCard";
import { generationJobsQueryKey } from "../../../components/generations/GenerationCenter";
import { ScientificProjectMaterialCard } from "../../../components/generations/ScientificProjectHistory";
import { useLanguage } from "../../../i18n/LanguageContext";
import {
  listGenerationJobs,
  listScienceProjects,
  type GenerationJobSummary,
  type ScienceProjectListItem,
} from "../../../lib/api";
import { generationMaterialFilterFromKind, isPrimaryGenerationMaterial, type GenerationMaterialFilter } from "../../../lib/generation-history";
import { teacherFacingErrorMessage } from "../../../lib/teacher-facing-error";
import { useAuth } from "@/contexts/AuthContext";
import { canAccessVideoGeneration } from "@/lib/access-policy";


const HISTORY_PAGE_SIZE = 30;


export default function Page() {
  return <Suspense fallback={<div className="h-72 animate-pulse rounded-3xl bg-white" />}><GenerationHistoryFromQuery /></Suspense>;
}

function GenerationHistoryFromQuery() {
  const params = useSearchParams();
  const initialFilter = generationMaterialFilterFromKind(params.get("kind"));
  return <GenerationsPage key={initialFilter} initialFilter={initialFilter} />;
}

function GenerationsPage({ initialFilter }: { initialFilter: GenerationMaterialFilter }) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const [actionError, setActionError] = useState<string | null>(null);
  const [materialFilter, setMaterialFilter] = useState<GenerationMaterialFilter>(initialFilter);
  const jobs = useInfiniteQuery({
    queryKey: [...generationJobsQueryKey, "history"],
    queryFn: ({ pageParam }) => listGenerationJobs({
      limit: HISTORY_PAGE_SIZE,
      offset: pageParam,
    }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.next_offset ?? undefined,
    staleTime: 1_000,
    retry: 2,
    refetchOnReconnect: true,
    refetchOnWindowFocus: true,
    refetchInterval: (query) =>
      query.state.data?.pages.some((page) => page.active_count > 0) ? 2_500 : 30_000,
  });
  const scienceProjects = useInfiniteQuery({
    queryKey: ["science-project-history", HISTORY_PAGE_SIZE],
    queryFn: ({ pageParam }) => listScienceProjects(HISTORY_PAGE_SIZE, pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.next_offset ?? undefined,
    staleTime: 1_000,
    retry: 2,
    refetchOnReconnect: true,
    refetchOnWindowFocus: true,
    refetchInterval: (query) =>
      query.state.data?.pages.some((page) =>
        page.items.some((project) => Boolean(project.active_job_id)),
      ) ? 5_000 : 30_000,
  });
  const items = useMemo(() => {
    const unique = new Map<string, GenerationJobSummary>();
    for (const page of jobs.data?.pages ?? []) {
      for (const job of page.items) {
        if (isPrimaryGenerationMaterial(job)) unique.set(job.id, job);
      }
    }
    return [...unique.values()];
  }, [jobs.data?.pages]);
  const projectItems = useMemo(
    () => {
      const unique = new Map<string, ScienceProjectListItem>();
      for (const page of scienceProjects.data?.pages ?? []) {
        for (const project of page.items) unique.set(project.project_id, project);
      }
      return [...unique.values()];
    },
    [scienceProjects.data?.pages],
  );
  const materialItems = useMemo(() => [
    ...items.map((job) => ({
      key: `job-${job.id}`,
      updatedAt: job.updated_at,
      job,
      project: null,
    })),
    ...projectItems.map((project) => ({
      key: `science-${project.project_id}`,
      updatedAt: project.updated_at,
      job: null,
      project,
    })),
  ].sort((left, right) => {
    const leftTime = Date.parse(left.updatedAt);
    const rightTime = Date.parse(right.updatedAt);
    return (Number.isNaN(rightTime) ? 0 : rightTime) - (Number.isNaN(leftTime) ? 0 : leftTime);
  }), [items, projectItems]);
  const hasMaterials = materialItems.length > 0;
  const visibleMaterials = materialFilter === "all"
    ? materialItems
    : materialItems.filter(item => item.job?.kind === ({
      trainings: "training.generate",
      masterclasses: "masterclass.generate",
      "preschool-projects": "preschool_project.generate",
    }[materialFilter]));
  const initialLoading = jobs.isLoading || scienceProjects.isLoading;
  const queryError = jobs.error ?? scienceProjects.error;

  const refetchAll = () => {
    void jobs.refetch();
    void scienceProjects.refetch();
  };

  const fetchMore = async () => {
    await Promise.all([
      jobs.hasNextPage ? jobs.fetchNextPage() : Promise.resolve(),
      scienceProjects.hasNextPage ? scienceProjects.fetchNextPage() : Promise.resolve(),
    ]);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <header className="rounded-3xl border border-white/70 bg-white/95 p-6 shadow-sm">
        <p className="text-sm font-semibold text-[color:var(--primary)]">
          {language === "kk" ? "Сіздің жұмыстарыңыз" : "Ваши работы"}
        </p>
        <h1 className="mt-1 text-3xl font-bold text-slate-950">
          {language === "kk" ? "Менің материалдарым" : "Мои материалы"}
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          {language === "kk"
            ? "Дайын материалды ашыңыз немесе жүктеп алыңыз. Жасалып жатқан жұмысты күту үшін бұл бетте қалудың қажеті жоқ."
            : "Откройте или скачайте готовый материал. Оставаться на странице во время создания не нужно."}
        </p>
      </header>

      {canAccessVideoGeneration(user?.role) && <Link href="/dashboard/media/video" className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-teal-200 bg-white px-5 py-4 text-sm text-slate-700 transition hover:border-teal-500">
        <span><strong className="text-teal-900">{language === "kk" ? "Менің видео жобаларым" : "Мои видеопроекты"}</strong><span className="mt-1 block text-xs text-slate-500">{language === "kk" ? "Видеолар 24 сағат сақталады. Жоба соңғы өзгерістен кейін 24 сағаттан соң жойылады." : "Видео хранятся 24 часа. Проект удаляется через 24 часа после последнего изменения."}</span></span>
        <span aria-hidden="true">→</span>
      </Link>}

      <nav aria-label={language === "kk" ? "Материал түрі" : "Тип материалов"} className="flex flex-wrap gap-2">
        {(["all", "masterclasses", "trainings", "preschool-projects"] as const).map(value => <button key={value} type="button" aria-pressed={materialFilter === value} onClick={() => setMaterialFilter(value)} className={`min-h-11 rounded-xl border px-4 py-2.5 text-xs font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 ${materialFilter === value ? "border-teal-700 bg-teal-700 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-teal-300 hover:bg-teal-50"}`}>{({
          all: language === "kk" ? "Барлық материал" : "Все материалы",
          masterclasses: language === "kk" ? "Мастер-класстар" : "Мастер-классы",
          trainings: language === "kk" ? "Тренингтер" : "Тренинги",
          "preschool-projects": language === "kk" ? "Балабақша жобалары" : "Дошкольные проекты",
        })[value]}</button>)}
      </nav>

      {actionError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          {actionError}
        </div>
      ) : null}

      {initialLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label={language === "kk" ? "Материалдар жүктелуде" : "Материалы загружаются"}>
          {[0, 1, 2, 3, 4, 5].map((item) => (
            <div key={item} className="h-48 animate-pulse rounded-3xl bg-white/70" />
          ))}
        </div>
      ) : queryError && !hasMaterials ? (
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-8 text-center">
          <p className="font-semibold text-amber-950">
            {teacherFacingErrorMessage(queryError, language)}
          </p>
          <button
            type="button"
            onClick={refetchAll}
            className="mt-4 rounded-full bg-slate-950 px-5 py-2.5 text-sm font-bold text-white"
          >
            {language === "kk" ? "Қайта жүктеу" : "Попробовать снова"}
          </button>
        </div>
      ) : !hasMaterials && !jobs.hasNextPage && !scienceProjects.hasNextPage ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white/80 p-12 text-center">
          <div className="text-4xl" aria-hidden="true">📂</div>
          <p className="mt-4 font-semibold text-slate-900">
            {language === "kk" ? "Әзірге материал жоқ" : "Материалов пока нет"}
          </p>
          <p className="mt-2 text-sm text-slate-600">
            {language === "kk" ? "ЖИ құралдарының бірін қолданып көріңіз." : "Создайте первый материал в любом ИИ-инструменте."}
          </p>
        </div>
      ) : (
        <>
          {queryError ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <p>{teacherFacingErrorMessage(queryError, language)}</p>
              <button
                type="button"
                onClick={refetchAll}
                className="mt-2 font-bold underline underline-offset-4"
              >
                {language === "kk" ? "Қайта жүктеу" : "Попробовать снова"}
              </button>
            </div>
          ) : null}
          {materialFilter === "masterclasses" && !visibleMaterials.length && <p className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">{language === "kk" ? "Осы бетте мастер-класс табылмады. Жаңа мастер-класс жасаңыз немесе басқа материалдарды жүктеңіз." : "На этой странице пока нет мастер-классов. Создайте первый или загрузите следующие материалы."}</p>}
          {materialFilter === "preschool-projects" && !visibleMaterials.length && <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600"><p>{language === "kk" ? "Жүктелген материалдар арасында балабақша жобалары жоқ. Алғашқы жобаңызды жасаңыз немесе келесі материалдарды көрсетіңіз." : "Среди загруженных материалов пока нет дошкольных проектов. Создайте первый или покажите следующие материалы."}</p><Link href="/dashboard/ai/preschool-projects" className="mt-3 inline-flex min-h-11 items-center font-semibold text-teal-800 underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700">{language === "kk" ? "Жоба жасау" : "Создать проект"}</Link></div>}
          {materialFilter === "trainings" && !visibleMaterials.length && <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600"><p>{language === "kk" ? "Жүктелген материалдар арасында тренинг жоқ. Алғашқы тренингті жасаңыз немесе келесі материалдарды көрсетіңіз." : "Среди загруженных материалов пока нет тренингов. Создайте первый или покажите следующие материалы."}</p><Link href="/dashboard/ai/trainings" className="mt-3 inline-flex min-h-11 items-center font-semibold text-teal-800 underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700">{language === "kk" ? "Тренинг жасау" : "Создать тренинг"}</Link></div>}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {visibleMaterials.map(({ key, job, project }) => job ? (
              <GenerationMaterialCard
                key={key}
                job={job}
                language={language}
                onActionError={(error) => setActionError(teacherFacingErrorMessage(error, language))}
              />
            ) : project ? (
              <ScientificProjectMaterialCard
                key={key}
                project={project}
                language={language}
                onActionError={(error) => setActionError(teacherFacingErrorMessage(error, language))}
              />
            ) : null)}
          </div>
          {jobs.hasNextPage || scienceProjects.hasNextPage ? (
            <button
              type="button"
              onClick={() => void fetchMore()}
              disabled={jobs.isFetchingNextPage || scienceProjects.isFetchingNextPage}
              className="mx-auto block min-h-11 rounded-2xl border border-slate-300 bg-white px-6 text-sm font-bold text-slate-800 shadow-sm transition hover:border-slate-400 disabled:cursor-wait disabled:opacity-60"
            >
              {jobs.isFetchingNextPage || scienceProjects.isFetchingNextPage
                ? language === "kk" ? "Жүктелуде…" : "Загружаем…"
                : language === "kk" ? "Тағы көрсету" : "Показать ещё"}
            </button>
          ) : null}
        </>
      )}
    </div>
  );
}
