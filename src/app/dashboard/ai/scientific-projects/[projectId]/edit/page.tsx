"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useLanguage, useTranslations } from "../../../../../../i18n/LanguageContext";
import {
  enqueueProjectFinalization,
  enqueueSectionRegeneration,
  clearGenerationIntentForJob,
  getGenerationJob,
  getProjectStatus,
  exportScientificProjectDocx,
  ProjectState,
  CompleteProjectResponse,
} from "../../../../../../lib/api";
import Markdown from "react-markdown";
import { useTokens } from "../../../../../../hooks/useTokens";
import { InsufficientTokensError } from "../../../../../../lib/api";
import {
  generationJobIdFromSearchParam,
  generationServerStatusCopy,
  isAcknowledgedGenerationJob,
  isActiveGenerationJob,
  isUnavailableGenerationJobError,
} from "../../../../../../lib/generation-history";
import { completeScienceProjectFromState } from "../../../../../../lib/science-project-history";
import { useTeacherErrorMessage } from "@/hooks/useTeacherErrorMessage";

function EditProjectContent() {
  const t = useTranslations();
  const { language } = useLanguage();
  const toTeacherErrorMessage = useTeacherErrorMessage();
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const projectId = params.projectId as string;
  const requestedJobId = generationJobIdFromSearchParam(searchParams.get("job"));
  const [sessionJobId, setSessionJobId] = useState<string | null>(null);
  const currentJobId = requestedJobId ?? sessionJobId;
  const handledJobId = useRef<string | null>(null);
  const { refreshBalance, costs, checkBalance } = useTokens();

  const [loading, setLoading] = useState(true);
  const [finalizing, setFinalizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sections, setSections] = useState<Record<string, string>>({});
  const [finalized, setFinalized] = useState<CompleteProjectResponse | null>(null);
  const [regenerating, setRegenerating] = useState<string | null>(null);
  const [regenerateInstructions, setRegenerateInstructions] = useState<Record<string, string>>({});

  const job = useQuery({
    queryKey: ["generation-job", currentJobId],
    queryFn: () => getGenerationJob(currentJobId as string),
    enabled: Boolean(currentJobId),
    retry: (failureCount, requestError) =>
      !isUnavailableGenerationJobError(requestError) && failureCount < 2,
    refetchOnReconnect: true,
    refetchOnWindowFocus: true,
    refetchInterval: (query) => {
      const value = query.state.data;
      return value && isActiveGenerationJob(value) ? 2_000 : false;
    },
  });

  useEffect(() => {
    let active = true;

    const loadState = async () => {
      try {
        const state: ProjectState = await getProjectStatus(projectId);
        if (active) {
          setSections(state.sections || {});
          setFinalized(completeScienceProjectFromState(state));
        }
      } catch (err: unknown) {
        if (active) setError(toTeacherErrorMessage(err));
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadState();
    return () => {
      active = false;
    };
  }, [projectId, toTeacherErrorMessage]);

  useEffect(() => {
    const value = job.data;
    if (!value || handledJobId.current === value.id) return;
    if (value.kind !== "science.regenerate" && value.kind !== "science.finalize") {
      handledJobId.current = value.id;
      setError(
        language === "kk"
          ? "Бұл сілтеме ғылыми жобаны өңдеу әрекетіне жатпайды."
          : "Эта ссылка ведёт не на редактирование научного проекта.",
      );
      return;
    }
    if ((value.status === "completed" || value.status === "billing_error") && value.result) {
      handledJobId.current = value.id;
      clearGenerationIntentForJob(value.id);
      let active = true;
      void getProjectStatus(projectId)
        .then((state) => {
          if (!active) return;
          setSections(state.sections || {});
          setFinalized(completeScienceProjectFromState(state));
          setRegenerating(null);
          setFinalizing(false);
          refreshBalance();
          void queryClient.invalidateQueries({ queryKey: ["science-project-history"] });
          router.replace(
            `/dashboard/ai/scientific-projects/${encodeURIComponent(projectId)}/edit`,
            { scroll: false },
          );
        })
        .catch((restoreError: unknown) => {
          if (active) setError(toTeacherErrorMessage(restoreError));
        });
      return () => {
        active = false;
      };
    }
    if (value.status === "failed" || value.status === "cancelled") {
      handledJobId.current = value.id;
      clearGenerationIntentForJob(value.id);
      setRegenerating(null);
      setFinalizing(false);
      refreshBalance();
      setError(
        language === "kk"
          ? "Өзгерісті сақтау мүмкін болмады. Монеталар қайтарылды — қайта көріңіз."
          : "Не удалось сохранить изменение. Монеты возвращены — попробуйте ещё раз.",
      );
    }
  }, [job.data, language, projectId, queryClient, refreshBalance, router, toTeacherErrorMessage]);

  useEffect(() => {
    if (!job.error) return;
    const acknowledged = isAcknowledgedGenerationJob(
      job.data,
      currentJobId,
      ["science.regenerate", "science.finalize"],
    );
    if (isUnavailableGenerationJobError(job.error) && !acknowledged) {
      if (currentJobId) handledJobId.current = currentJobId;
      setSessionJobId(null);
      setRegenerating(null);
      setFinalizing(false);
      setError(
        language === "kk"
          ? "Бұл әрекет енді қолжетімді емес. Жоба сақталған күйінде ашылды."
          : "Эта операция больше недоступна. Проект открыт в сохранённом состоянии.",
      );
      router.replace(
        `/dashboard/ai/scientific-projects/${encodeURIComponent(projectId)}/edit`,
        { scroll: false },
      );
      return;
    }
    setError(toTeacherErrorMessage(job.error));
  }, [currentJobId, job.data, job.error, language, projectId, router, toTeacherErrorMessage]);

  const handleRegenerate = async (sectionType: string) => {
    const instruction = regenerateInstructions[sectionType]?.trim() ?? "";
    if (!instruction) {
      alert("Введите инструкцию для перегенерации");
      return;
    }

    setRegenerating(sectionType);
    setError(null);

    try {
      const createdJob = await enqueueSectionRegeneration({
        project_id: projectId,
        section_type: sectionType,
        instruction,
        current_content: sections[sectionType] || "",
      });
      handledJobId.current = null;
      setSessionJobId(createdJob.id);
      queryClient.setQueryData(["generation-job", createdJob.id], createdJob);
      router.replace(
        `/dashboard/ai/scientific-projects/${encodeURIComponent(projectId)}/edit?job=${encodeURIComponent(createdJob.id)}`,
        { scroll: false },
      );
    } catch (err: unknown) {
      setRegenerating(null);
      if (err instanceof InsufficientTokensError) {
        setError(
          `${t.tokens?.insufficient || "Недостаточно токенов"}. ${t.tokens?.required || "Требуется"}: ${err.required}, ${t.tokens?.available || "Доступно"}: ${err.available}`
        );
      } else {
        setError(toTeacherErrorMessage(err, t.scientificProject.errors.generic));
      }
    }
  };

  const handleFinalize = async () => {
    setFinalizing(true);
    setError(null);

    try {
      const createdJob = await enqueueProjectFinalization({
        project_id: projectId,
      });
      handledJobId.current = null;
      setSessionJobId(createdJob.id);
      queryClient.setQueryData(["generation-job", createdJob.id], createdJob);
      router.replace(
        `/dashboard/ai/scientific-projects/${encodeURIComponent(projectId)}/edit?job=${encodeURIComponent(createdJob.id)}`,
        { scroll: false },
      );
    } catch (err: unknown) {
      setFinalizing(false);
      setError(toTeacherErrorMessage(err, t.scientificProject.errors.generic));
    }
  };

  const handleExport = async () => {
    if (!finalized) {
      alert("Сначала финализируйте проект");
      return;
    }

    try {
      const blob = await exportScientificProjectDocx({ content: finalized });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "scientific_project.docx";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error(err);
      alert("Ошибка экспорта");
    }
  };

  const sectionLabels: Record<string, string> = {
    introduction: t.scientificProject.results.introduction,
    chapter_1: t.scientificProject.results.chapterTheory,
    chapter_2: t.scientificProject.results.chapterResearch,
    conclusion: t.scientificProject.results.conclusion,
  };
  const operationAcknowledged = isAcknowledgedGenerationJob(
    job.data,
    currentJobId,
    ["science.regenerate", "science.finalize"],
  );
  const operationActive = Boolean(
    currentJobId && (job.isLoading || (operationAcknowledged && job.data && isActiveGenerationJob(job.data))),
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[color:var(--primary)] border-r-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-beige to-green-50 p-4 sm:p-6">
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-6 text-3xl font-bold text-slate-900">
          {t.scientificProject.wizard.step4}
        </h1>

        {error && (
          <div className="mb-4 rounded-xl bg-red-50 p-4 text-sm text-red-600">{error}</div>
        )}

        {operationActive ? (
          <div aria-live="polite" className="mb-6 flex items-center gap-4 rounded-3xl border border-sky-200 bg-sky-50 p-5 text-sky-950">
            <div className="h-10 w-10 shrink-0 animate-spin rounded-full border-4 border-sky-200 border-t-sky-600" />
            <div>
              <p className="font-bold">
                {job.data?.kind === "science.finalize"
                  ? language === "kk" ? "Жоба аяқталып жатыр" : "Завершаем проект"
                  : language === "kk" ? "Бөлім жаңартылып жатыр" : "Обновляем раздел"}
              </p>
              <p className="mt-1 text-sm leading-6 text-sky-800">
                {generationServerStatusCopy(language, operationAcknowledged)}
              </p>
            </div>
          </div>
        ) : null}

        {!finalized ? (
          <>
            {/* Sections */}
            <div className="space-y-6">
              {Object.entries(sections).map(([key, content]) => (
                <div
                  key={key}
                  className="glass-card rounded-3xl border border-white/60 p-6 shadow-sm"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-900">
                      {sectionLabels[key] || key}
                    </h3>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Инструкция для перегенерации..."
                        value={regenerateInstructions[key] ?? ""}
                        onChange={(e) => setRegenerateInstructions((current) => ({
                          ...current,
                          [key]: e.target.value,
                        }))}
                        className="rounded-lg border border-slate-200 px-3 py-1 text-xs"
                        disabled={operationActive}
                      />
                      <button
                        onClick={() => handleRegenerate(key)}
                        disabled={operationActive || regenerating === key || !checkBalance("sciproject_regenerate")}
                        className="rounded-lg bg-orange-500 px-3 py-1 text-xs font-semibold text-white disabled:opacity-50"
                      >
                        {regenerating === key ? "..." : `🔄 ${t.scientificProject.wizard.regenerateSection} (${costs.sciproject_regenerate || 3} ${t.tokens?.balance || "токенов"})`}
                      </button>
                    </div>
                  </div>
                  <div className="prose prose-sm max-w-none text-slate-800">
                    <Markdown>{content}</Markdown>
                  </div>
                </div>
              ))}
            </div>

            {/* Finalize Button */}
            <div className="mt-8">
              <button
                onClick={handleFinalize}
                disabled={finalizing || operationActive}
                className="w-full rounded-2xl bg-gradient-to-r from-[color:var(--primary)] to-[color:var(--secondary)] py-4 text-sm font-bold text-white shadow-lg transition hover:opacity-90 disabled:opacity-50"
              >
                {finalizing ? (
                  <>
                    <div className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent" />
                    Финализация...
                  </>
                ) : (
                  t.scientificProject.wizard.finalize
                )}
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Finalized Sections */}
            <div className="space-y-6">
              <div className="glass-card rounded-3xl border border-white/60 p-6 shadow-sm">
                <h3 className="mb-4 text-lg font-bold text-slate-900">
                  {t.scientificProject.results.titlePage}
                </h3>
                <div className="prose prose-sm max-w-none text-slate-800">
                  <Markdown>{finalized.title_page}</Markdown>
                </div>
              </div>

              <div className="glass-card rounded-3xl border border-white/60 p-6 shadow-sm">
                <h3 className="mb-4 text-lg font-bold text-slate-900">
                  {t.scientificProject.results.annotation}
                </h3>
                <div className="prose prose-sm max-w-none text-slate-800">
                  <Markdown>{finalized.annotation}</Markdown>
                </div>
              </div>

              {Object.entries({
                introduction: finalized.introduction,
                chapter_1_theory: finalized.chapter_1_theory,
                chapter_2_research: finalized.chapter_2_research,
                conclusion: finalized.conclusion,
              }).map(([key, content]) => (
                <div key={key} className="glass-card rounded-3xl border border-white/60 p-6 shadow-sm">
                  <h3 className="mb-4 text-lg font-bold text-slate-900">
                    {sectionLabels[key.replace("_theory", "").replace("_research", "")] || key}
                  </h3>
                  <div className="prose prose-sm max-w-none text-slate-800">
                    <Markdown>{content}</Markdown>
                  </div>
                </div>
              ))}

              <div className="glass-card rounded-3xl border border-white/60 p-6 shadow-sm">
                <h3 className="mb-4 text-lg font-bold text-slate-900">
                  {t.scientificProject.results.references}
                </h3>
                <div className="prose prose-sm max-w-none text-slate-800">
                  <Markdown>{finalized.references}</Markdown>
                </div>
              </div>

              <div className="glass-card rounded-3xl border border-white/60 p-6 shadow-sm">
                <h3 className="mb-4 text-lg font-bold text-slate-900">
                  {t.scientificProject.results.appendix}
                </h3>
                <div className="prose prose-sm max-w-none text-slate-800">
                  <Markdown>{finalized.appendix}</Markdown>
                </div>
              </div>
            </div>

            {/* Export Button */}
            <div className="mt-8">
              <button
                onClick={handleExport}
                className="w-full rounded-2xl bg-gradient-to-r from-[color:var(--primary)] to-[color:var(--secondary)] py-4 text-sm font-bold text-white shadow-lg transition hover:opacity-90"
              >
                {t.scientificProject.results.export}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}


export default function EditProjectPage() {
  return (
    <Suspense fallback={<div className="min-h-96 animate-pulse rounded-3xl bg-white/70" />}>
      <EditProjectContent />
    </Suspense>
  );
}
