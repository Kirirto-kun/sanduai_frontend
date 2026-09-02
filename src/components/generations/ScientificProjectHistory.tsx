"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";

import { useLanguage } from "../../i18n/LanguageContext";
import {
  exportScientificProjectDocx,
  getProjectStatus,
  listScienceProjects,
  type ScienceProjectListItem,
} from "../../lib/api";
import { saveBlob } from "../../lib/generation-download";
import {
  completeScienceProjectFromState,
  hasActiveScienceProject,
  scienceProjectOpenHref,
  scienceProjectProgressLabel,
} from "../../lib/science-project-history";
import { teacherFacingErrorMessage } from "../../lib/teacher-facing-error";


function expiryCopy(project: ScienceProjectListItem, language: "ru" | "kk"): string {
  if (!project.expires_at) {
    return language === "kk" ? "Сақтау мерзімі нақтылануда" : "Срок хранения уточняется";
  }
  const expiresAt = new Date(project.expires_at);
  if (Number.isNaN(expiresAt.getTime())) {
    return language === "kk" ? "Сақтау мерзімі нақтылануда" : "Срок хранения уточняется";
  }
  const formatted = new Intl.DateTimeFormat(language === "kk" ? "kk-KZ" : "ru-RU", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(expiresAt);
  return language === "kk" ? `${formatted} дейін қолжетімді` : `Доступно до ${formatted}`;
}


function safeFileName(value: string): string {
  return value
    .trim()
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, "_")
    .slice(0, 80) || "scientific_project";
}


export function ScientificProjectMaterialCard({
  project,
  language,
  onActionError,
}: {
  project: ScienceProjectListItem;
  language: "ru" | "kk";
  onActionError?: (error: unknown) => void;
}) {
  const [downloading, setDownloading] = useState(false);
  const active = Boolean(project.active_job_id);

  const download = async () => {
    if (!project.is_complete || downloading) return;
    setDownloading(true);
    try {
      const state = await getProjectStatus(project.project_id);
      const complete = completeScienceProjectFromState(state);
      if (!complete) throw new Error("MATERIAL_NOT_READY");
      const blob = await exportScientificProjectDocx({ content: complete });
      saveBlob(blob, `${safeFileName(project.title)}.docx`);
    } catch (error) {
      onActionError?.(error);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <article className="flex min-h-48 flex-col rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <p
        className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-wide ${
          active ? "text-sky-700" : "text-emerald-700"
        }`}
        role={active ? "status" : undefined}
      >
        {active ? <span aria-hidden="true" className="h-2 w-2 animate-pulse rounded-full bg-sky-500" /> : null}
        {scienceProjectProgressLabel(
          project.step,
          project.sections_ready,
          language,
          project.active_job_id ?? null,
        )}
      </p>
      <h3 className="mt-1 line-clamp-2 text-lg font-bold text-slate-950">{project.title}</h3>
      <p className="mt-4 text-xs leading-5 text-slate-500">{expiryCopy(project, language)}</p>

      <div className="mt-auto grid grid-cols-2 gap-2 pt-5">
        <Link
          href={scienceProjectOpenHref(project)}
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-3 text-sm font-bold text-slate-800 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
        >
          {language === "kk" ? "Ашу" : "Открыть"}
        </Link>
        <button
          type="button"
          onClick={() => void download()}
          disabled={!project.is_complete || downloading}
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


export function ScientificProjectHistory({ limit = 9 }: { limit?: number }) {
  const { language } = useLanguage();
  const [actionError, setActionError] = useState<string | null>(null);
  const [visiblePages, setVisiblePages] = useState(1);
  const pageSize = Math.max(1, Math.min(50, Math.trunc(limit)));
  const visibleLimit = pageSize * visiblePages;
  const projects = useInfiniteQuery({
    queryKey: ["science-project-history"],
    queryFn: ({ pageParam }) => listScienceProjects(50, pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.next_offset ?? undefined,
    staleTime: 1_000,
    retry: 2,
    refetchOnReconnect: true,
    refetchOnWindowFocus: true,
    refetchInterval: (query) =>
      hasActiveScienceProject(
        query.state.data?.pages.flatMap((page) => page.items) ?? [],
      ) ? 5_000 : false,
  });
  const allProjects = useMemo(() => {
    const unique = new Map<string, ScienceProjectListItem>();
    for (const page of projects.data?.pages ?? []) {
      for (const project of page.items) unique.set(project.project_id, project);
    }
    return [...unique.values()];
  }, [projects.data?.pages]);
  const visibleProjects = allProjects.slice(0, visibleLimit);
  const hasMore = visibleProjects.length < allProjects.length || projects.hasNextPage;

  const showMore = async () => {
    if (visibleProjects.length >= allProjects.length && projects.hasNextPage) {
      await projects.fetchNextPage();
    }
    setVisiblePages((current) => current + 1);
  };

  if (!projects.isLoading && !projects.isError && allProjects.length === 0) return null;

  return (
    <section className="mt-8 rounded-3xl border border-white/70 bg-white/80 p-5 shadow-sm sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--primary)]">
        {language === "kk" ? "Тарих" : "История"}
      </p>
      <h2 className="mt-1 text-xl font-bold text-slate-950">
        {language === "kk" ? "Менің ғылыми жобаларым" : "Мои научные проекты"}
      </h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        {language === "kk"
          ? "Әр жоба бір рет көрсетіледі. Ашқанда жұмыс сақталған қадамнан жалғасады."
          : "Каждый проект показан один раз. При открытии работа продолжится с сохранённого шага."}
      </p>

      {actionError ? (
        <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
          {actionError}
        </div>
      ) : null}

      {projects.isLoading ? (
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3" aria-label={language === "kk" ? "Жүктелуде" : "Загрузка"}>
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-48 animate-pulse rounded-3xl bg-slate-100" />
          ))}
        </div>
      ) : projects.isError ? (
        <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p>{teacherFacingErrorMessage(projects.error, language)}</p>
          <button
            type="button"
            onClick={() => void projects.refetch()}
            className="mt-3 font-bold underline underline-offset-4"
          >
            {language === "kk" ? "Қайта жүктеу" : "Попробовать снова"}
          </button>
        </div>
      ) : (
        <>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {visibleProjects.map((project) => (
              <ScientificProjectMaterialCard
                key={project.project_id}
                project={project}
                language={language}
                onActionError={(error) => setActionError(teacherFacingErrorMessage(error, language))}
              />
            ))}
          </div>
          {hasMore ? (
            <div className="mt-5 flex justify-center">
              <button
                type="button"
                onClick={() => void showMore()}
                disabled={projects.isFetchingNextPage}
                className="min-h-11 rounded-xl border border-slate-300 bg-white px-5 text-sm font-bold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 disabled:cursor-wait disabled:opacity-60"
              >
                {projects.isFetchingNextPage
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
