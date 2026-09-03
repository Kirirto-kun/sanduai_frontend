"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter, useSearchParams } from "next/navigation";

import { useLanguage, useTranslations } from "../../../../../../i18n/LanguageContext";
import {
  clearGenerationIntentForJob,
  enqueueAllProjectSections,
  getGenerationJob,
  getProjectStatus,
} from "../../../../../../lib/api";
import {
  generationJobIdFromSearchParam,
  generationServerStatusCopy,
  isActiveGenerationJob,
} from "../../../../../../lib/generation-history";
import { useTeacherErrorMessage } from "@/hooks/useTeacherErrorMessage";

const SECTIONS = ["introduction", "chapter_1", "chapter_2", "conclusion"] as const;

type GenerationIssue = {
  message: string;
  action: "restart" | "back";
};

function requestStatus(error: unknown): number | null {
  if (!error || typeof error !== "object") return null;
  const status = (error as { status?: unknown }).status;
  return typeof status === "number" ? status : null;
}

function GenerateProgressContent() {
  const t = useTranslations();
  const { language } = useLanguage();
  const toTeacherErrorMessage = useTeacherErrorMessage();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const projectId = params.projectId as string;
  const requestedJobId = generationJobIdFromSearchParam(searchParams.get("job"));
  const [sessionJobId, setSessionJobId] = useState<string | null>(null);
  const currentJobId = requestedJobId ?? sessionJobId;
  const [generationIssue, setGenerationIssue] = useState<GenerationIssue | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const startingJob = useRef(false);
  const handledJobId = useRef<string | null>(null);

  const projectState = useQuery({
    queryKey: ["science-project-status", projectId],
    queryFn: () => getProjectStatus(projectId),
    retry: 2,
    refetchOnReconnect: true,
  });

  const job = useQuery({
    queryKey: ["generation-job", currentJobId],
    queryFn: () => getGenerationJob(currentJobId as string),
    enabled: Boolean(currentJobId),
    retry: 2,
    refetchOnReconnect: true,
    refetchOnWindowFocus: true,
    refetchInterval: (query) => {
      const value = query.state.data;
      return value && isActiveGenerationJob(value) ? 2_000 : false;
    },
  });

  const plan = projectState.data?.plan ?? null;
  const savedSections = projectState.data?.sections;
  const currentStep = savedSections
    ? SECTIONS.findIndex((section) => !savedSections[section])
    : 0;
  const normalizedCurrentStep = currentStep >= 0 ? currentStep : SECTIONS.length;

  useEffect(() => {
    if (projectState.data && currentStep < 0) {
      router.replace(`/dashboard/ai/scientific-projects/${encodeURIComponent(projectId)}/edit`);
    }
  }, [currentStep, projectId, projectState.data, router]);

  const startGeneration = useCallback(async () => {
    if (!plan || startingJob.current) return;
    startingJob.current = true;
    setSubmitting(true);
    setGenerationIssue(null);
    try {
      const createdJob = await enqueueAllProjectSections({
        project_id: projectId,
        approved_plan: plan,
      });
      handledJobId.current = null;
      setSessionJobId(createdJob.id);
      queryClient.setQueryData(["generation-job", createdJob.id], createdJob);
      router.replace(
        `/dashboard/ai/scientific-projects/${encodeURIComponent(projectId)}/generate?job=${encodeURIComponent(createdJob.id)}`,
        { scroll: false },
      );
    } catch (error: unknown) {
      setGenerationIssue({
        message: toTeacherErrorMessage(error),
        action: "restart",
      });
    } finally {
      startingJob.current = false;
      setSubmitting(false);
    }
  }, [plan, projectId, queryClient, router, toTeacherErrorMessage]);

  useEffect(() => {
    if (
      projectState.isSuccess
      && plan
      && normalizedCurrentStep < SECTIONS.length
      && !currentJobId
      && !generationIssue
    ) {
      void startGeneration();
    }
  }, [
    currentJobId,
    generationIssue,
    normalizedCurrentStep,
    plan,
    projectState.isSuccess,
    startGeneration,
  ]);

  useEffect(() => {
    const value = job.data;
    if (!value || handledJobId.current === value.id) return;

    if (value.kind !== "science.generate_all") {
      handledJobId.current = value.id;
      clearGenerationIntentForJob(value.id);
      setGenerationIssue({
        message: language === "kk"
          ? "Бұл сілтеме ғылыми жоба бөлімдеріне жатпайды."
          : "Эта ссылка ведёт не на создание разделов проекта.",
        action: "back",
      });
      return;
    }

    if ((value.status === "completed" || value.status === "billing_error") && value.result) {
      const resultProjectId = (value.result as Record<string, unknown>).project_id;
      handledJobId.current = value.id;
      if (resultProjectId !== projectId) {
        setGenerationIssue({
          message: toTeacherErrorMessage(new Error("INVALID_PROJECT_RESULT")),
          action: "back",
        });
        return;
      }
      void queryClient.invalidateQueries({ queryKey: ["science-project-history"] });
      void queryClient.invalidateQueries({ queryKey: ["science-project-status", projectId] });
      router.replace(`/dashboard/ai/scientific-projects/${encodeURIComponent(projectId)}/edit`);
      return;
    }

    if ((value.status === "completed" || value.status === "billing_error") && !value.result) {
      handledJobId.current = value.id;
      clearGenerationIntentForJob(value.id);
      setSessionJobId(null);
      void queryClient.invalidateQueries({ queryKey: ["science-project-status", projectId] });
      setGenerationIssue({
        message: language === "kk"
          ? "Жобаның сақталған күйін тексердік. Қалған бөлімдерді жалғастыруға болады."
          : "Проверили сохранённое состояние проекта. Можно продолжить оставшиеся разделы.",
        action: "restart",
      });
      router.replace(
        `/dashboard/ai/scientific-projects/${encodeURIComponent(projectId)}/generate`,
        { scroll: false },
      );
      return;
    }

    if (value.status === "failed" || value.status === "cancelled") {
      handledJobId.current = value.id;
      clearGenerationIntentForJob(value.id);
      setGenerationIssue({
        message: language === "kk"
          ? "Жоба бөлімдерін жасау мүмкін болмады. Сақталған жерінен қайта жалғастыруға болады."
          : "Не удалось создать разделы. Можно продолжить с сохранённого места.",
        action: "restart",
      });
    }
  }, [job.data, language, projectId, queryClient, router, toTeacherErrorMessage]);

  useEffect(() => {
    if (!currentJobId || handledJobId.current === currentJobId || !job.error) return;
    const status = requestStatus(job.error);
    if (status !== 404 && status !== 410) return;

    handledJobId.current = currentJobId;
    clearGenerationIntentForJob(currentJobId);
    setSessionJobId(null);
    setGenerationIssue({
      message: language === "kk"
        ? "Алдыңғы тапсырма енді қолжетімсіз. Жоба сақталған жерінен жалғасады."
        : "Предыдущее задание больше недоступно. Проект можно продолжить с сохранённого места.",
      action: "restart",
    });
    router.replace(
      `/dashboard/ai/scientific-projects/${encodeURIComponent(projectId)}/generate`,
      { scroll: false },
    );
  }, [currentJobId, job.error, language, projectId, router]);

  const sectionLabels: Record<(typeof SECTIONS)[number], string> = {
    introduction: t.scientificProject.wizard.progress.introduction,
    chapter_1: t.scientificProject.wizard.progress.chapter1,
    chapter_2: t.scientificProject.wizard.progress.chapter2,
    conclusion: t.scientificProject.wizard.progress.conclusion,
  };
  const progressCurrent = Math.max(
    normalizedCurrentStep,
    Number(job.data?.progress.current ?? 0),
  );
  const active = Boolean(
    currentJobId && (job.isLoading || (job.data && isActiveGenerationJob(job.data))),
  );
  const projectTransportError = projectState.error
    ? toTeacherErrorMessage(projectState.error)
    : null;
  const jobTransportError = job.error ? toTeacherErrorMessage(job.error) : null;
  const visibleError = jobTransportError ?? projectTransportError ?? generationIssue?.message ?? null;
  const retryLabel = language === "kk" ? "Қайта көру" : "Повторить";

  if (projectState.isLoading && !projectState.data) {
    return (
      <div className="flex min-h-screen items-center justify-center" role="status">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[color:var(--primary)] border-r-transparent" />
        <span className="sr-only">{language === "kk" ? "Жоба жүктелуде" : "Проект загружается"}</span>
      </div>
    );
  }

  if (projectState.error && !projectState.data) {
    return (
      <div className="min-h-screen p-4">
        <div className="mx-auto max-w-xl rounded-xl border border-red-200 bg-red-50 p-4 text-red-700" role="alert">
          <p>{projectTransportError}</p>
          <button
            type="button"
            onClick={() => void projectState.refetch()}
            className="mt-3 rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
          >
            {retryLabel}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-beige to-green-50 p-4 sm:p-6">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-6 text-3xl font-bold text-slate-900">{t.scientificProject.wizard.step3}</h1>

        <div className="glass-card rounded-3xl border border-white/60 px-6 py-6 shadow-md">
          {!visibleError ? (
            <p className="mb-6 text-sm leading-6 text-slate-600">
              {generationServerStatusCopy(language, !submitting && job.data?.id === currentJobId)}
            </p>
          ) : null}
          <div className="mb-8 space-y-4" aria-live="polite">
            {SECTIONS.map((section, index) => (
              <div
                key={section}
                className={`flex items-center gap-4 rounded-xl p-4 transition-all ${
                  index < progressCurrent
                    ? "bg-green-50 text-green-800"
                    : index === progressCurrent && active
                      ? "bg-[color:var(--primary)]/10 text-[color:var(--primary)] ring-2 ring-[color:var(--primary)]"
                      : "bg-slate-50 text-slate-400"
                }`}
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-full font-bold ${
                  index < progressCurrent
                    ? "bg-green-500 text-white"
                    : index === progressCurrent && active
                      ? "bg-[color:var(--primary)] text-white"
                      : "bg-slate-300 text-slate-600"
                }`}>
                  {index < progressCurrent ? "✓" : index + 1}
                </div>
                <div className="flex-1">
                  <div className="font-semibold">{sectionLabels[section]}</div>
                  {index === progressCurrent && active ? (
                    <div className="mt-1 text-xs">{language === "kk" ? "Жасалып жатыр…" : "Создаётся…"}</div>
                  ) : null}
                  {index < progressCurrent ? (
                    <div className="mt-1 text-xs">{language === "kk" ? "Дайын" : "Готово"}</div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>

          {visibleError ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700" role="alert">
              <p>{visibleError}</p>
              {jobTransportError ? (
                <button
                  type="button"
                  onClick={() => void job.refetch()}
                  className="mt-3 rounded-xl bg-slate-950 px-4 py-2 font-bold text-white"
                >
                  {retryLabel}
                </button>
              ) : projectTransportError ? (
                <button
                  type="button"
                  onClick={() => void projectState.refetch()}
                  className="mt-3 rounded-xl bg-slate-950 px-4 py-2 font-bold text-white"
                >
                  {retryLabel}
                </button>
              ) : generationIssue?.action === "restart" ? (
                <button
                  type="button"
                  onClick={() => void startGeneration()}
                  className="mt-3 rounded-xl bg-slate-950 px-4 py-2 font-bold text-white"
                >
                  {language === "kk" ? "Сақталған жерден жалғастыру" : "Продолжить с сохранённого места"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => router.push(`/dashboard/ai/scientific-projects/${encodeURIComponent(projectId)}/plan`)}
                  className="mt-3 rounded-xl bg-slate-950 px-4 py-2 font-bold text-white"
                >
                  {language === "kk" ? "Жоспарға оралу" : "Вернуться к плану"}
                </button>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function GenerateProgressPage() {
  return (
    <Suspense fallback={<div className="min-h-96 animate-pulse rounded-3xl bg-white/70" />}>
      <GenerateProgressContent />
    </Suspense>
  );
}
