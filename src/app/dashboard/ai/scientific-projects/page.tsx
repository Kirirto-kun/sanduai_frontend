"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { ScientificProjectHistory } from "../../../../components/generations/ScientificProjectHistory";
import { useLanguage, useTranslations } from "../../../../i18n/LanguageContext";
import {
  enqueueProjectPlan,
  getGenerationJob,
  clearGenerationIntentForJob,
  CreatePlanPayload,
  InsufficientTokensError,
} from "../../../../lib/api";
import {
  generationJobIdFromSearchParam,
  isActiveGenerationJob,
} from "../../../../lib/generation-history";
import { useTokens } from "../../../../hooks/useTokens";
import { useTeacherErrorMessage } from "@/hooks/useTeacherErrorMessage";

function ScientificProjectContent() {
  const t = useTranslations();
  const { language: interfaceLanguage } = useLanguage();
  const toTeacherErrorMessage = useTeacherErrorMessage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const requestedJobId = generationJobIdFromSearchParam(searchParams.get("job"));
  const [sessionJobId, setSessionJobId] = useState<string | null>(null);
  const currentJobId = requestedJobId ?? sessionJobId;
  const handledJobId = useRef<string | null>(null);
  const { refreshBalance, costs, balance, checkBalance } = useTokens();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [topic, setTopic] = useState("");
  const [direction, setDirection] = useState("");
  const [grade, setGrade] = useState("");
  const [researchType, setResearchType] = useState<"тәжірибелік" | "теориялық">("тәжірибелік");
  const [subject, setSubject] = useState("");
  const [language, setLanguage] = useState<"ru" | "kz" | "en">("ru");
  const [schoolName, setSchoolName] = useState("");
  const [supervisor, setSupervisor] = useState("");
  const [city, setCity] = useState("");

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

  useEffect(() => {
    const value = job.data;
    if (!value || handledJobId.current === value.id) return;
    if (value.kind !== "science.plan") {
      handledJobId.current = value.id;
      setError(
        interfaceLanguage === "kk"
          ? "Бұл сілтеме ғылыми жоба жоспарына жатпайды."
          : "Эта ссылка ведёт не на план научного проекта.",
      );
      return;
    }
    if ((value.status === "completed" || value.status === "billing_error") && value.result) {
      const projectId = (value.result as Record<string, unknown>).project_id;
      handledJobId.current = value.id;
      clearGenerationIntentForJob(value.id);
      if (typeof projectId !== "string" || !projectId) {
        setError(toTeacherErrorMessage(new Error("INVALID_PROJECT_RESULT")));
        return;
      }
      refreshBalance();
      void queryClient.invalidateQueries({ queryKey: ["science-project-history"] });
      router.replace(`/dashboard/ai/scientific-projects/${encodeURIComponent(projectId)}/plan`);
      return;
    }
    if (value.status === "failed" || value.status === "cancelled") {
      handledJobId.current = value.id;
      clearGenerationIntentForJob(value.id);
      refreshBalance();
      setError(
        interfaceLanguage === "kk"
          ? "Жоспар жасау мүмкін болмады. Монеталар қайтарылды — қайта көріңіз."
          : "Не удалось создать план. Монеты возвращены — попробуйте ещё раз.",
      );
    }
  }, [interfaceLanguage, job.data, queryClient, refreshBalance, router, toTeacherErrorMessage]);

  useEffect(() => {
    if (job.error) setError(toTeacherErrorMessage(job.error));
  }, [job.error, toTeacherErrorMessage]);

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic || !direction || !grade || !subject) {
      setError(t.scientificProject.errors.required);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload: CreatePlanPayload = {
        topic,
        direction,
        grade,
        research_type: researchType,
        subject,
        language,
        school_name: schoolName || undefined,
        supervisor: supervisor || undefined,
        city: city || undefined,
      };
      const createdJob = await enqueueProjectPlan(payload);
      handledJobId.current = null;
      setSessionJobId(createdJob.id);
      queryClient.setQueryData(["generation-job", createdJob.id], createdJob);
      router.replace(
        `/dashboard/ai/scientific-projects?job=${encodeURIComponent(createdJob.id)}`,
        { scroll: false },
      );
    } catch (err: unknown) {
      console.error(err);
      if (err instanceof InsufficientTokensError) {
        setError(
          `${t.tokens?.insufficient || "Недостаточно токенов"}. ${t.tokens?.required || "Требуется"}: ${err.required}, ${t.tokens?.available || "Доступно"}: ${err.available}`
        );
      } else {
        setError(toTeacherErrorMessage(err, t.scientificProject.errors.generic));
      }
    } finally {
      setLoading(false);
    }
  };

  const currentJob = job.data;
  const showJobProgress = Boolean(
    currentJobId && (job.isLoading || (currentJob && isActiveGenerationJob(currentJob))),
  );
  const progressCurrent = Math.max(0, Number(currentJob?.progress.current ?? 0));
  const progressTotal = Math.max(1, Number(currentJob?.progress.total ?? 1));
  const progressPercent = Math.max(
    4,
    Math.min(100, (progressCurrent / progressTotal) * 100),
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-beige to-green-50 p-4 sm:p-6">
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-6 text-3xl font-bold text-slate-900">
          {t.scientificProject.form.title}
        </h1>

        {showJobProgress ? (
          <section
            aria-live="polite"
            className="glass-card rounded-3xl border border-sky-200 bg-white/90 px-6 py-10 text-center shadow-md sm:px-10"
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-100 text-2xl" aria-hidden="true">
              🔬
            </div>
            <h2 className="mt-5 text-2xl font-bold text-slate-950">
              {interfaceLanguage === "kk" ? "Жоба жоспары жасалып жатыр" : "Создаём план проекта"}
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">
              {interfaceLanguage === "kk"
                ? "Бетті жаңартуға немесе жабуға болады — жұмыс серверде жалғасады."
                : "Страницу можно обновить или закрыть — работа продолжится на сервере."}
            </p>
            <div className="mx-auto mt-6 h-3 max-w-2xl overflow-hidden rounded-full bg-sky-100">
              <div
                className="h-full animate-pulse rounded-full bg-sky-500 transition-[width] duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </section>
        ) : (
        <div className="glass-card rounded-3xl border border-white/60 px-6 py-6 shadow-md sm:px-8">
          <form onSubmit={handleCreatePlan} className="space-y-6">
              {/* Topic */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  {t.scientificProject.form.topic}
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)]"
                  placeholder="Плесень на хлебе"
                  required
                />
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                {/* Direction */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    {t.scientificProject.form.direction}
                  </label>
                  <input
                    type="text"
                    value={direction}
                    onChange={(e) => setDirection(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)]"
                    placeholder="Биология"
                    required
                  />
                </div>

                {/* Grade */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    {t.scientificProject.form.grade}
                  </label>
                  <select
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)]"
                    required
                  >
                    <option value="">--</option>
                    {[...Array(11)].map((_, i) => (
                      <option key={i} value={String(i + 1)}>
                        {i + 1}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Research Type */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  {t.scientificProject.form.researchType}
                </label>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {[
                    { val: "тәжірибелік" as const, label: t.scientificProject.form.experimental },
                    { val: "теориялық" as const, label: t.scientificProject.form.theoretical },
                  ].map((opt) => (
                    <label
                      key={opt.val}
                      className={`flex cursor-pointer items-center justify-between rounded-xl border px-4 py-3 transition-all ${
                        researchType === opt.val
                          ? "border-[color:var(--primary)] bg-[color:var(--primary)]/5 ring-1 ring-[color:var(--primary)]"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="researchType"
                          value={opt.val}
                          checked={researchType === opt.val}
                          onChange={(e) => setResearchType(e.target.value as "тәжірибелік" | "теориялық")}
                          className="h-4 w-4 text-[color:var(--primary)] focus:ring-[color:var(--primary)]"
                        />
                        <span className="text-sm font-medium text-slate-900">{opt.label}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Subject */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  {t.scientificProject.form.subject}
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)]"
                  placeholder="Биология"
                  required
                />
              </div>

              {/* Optional Fields */}
              <div className="grid gap-6 sm:grid-cols-3">
                {/* School Name */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    {t.scientificProject.form.schoolName}
                  </label>
                  <input
                    type="text"
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)]"
                    placeholder={t.scientificProject.form.schoolNamePlaceholder}
                  />
                </div>

                {/* Supervisor */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    {t.scientificProject.form.supervisor}
                  </label>
                  <input
                    type="text"
                    value={supervisor}
                    onChange={(e) => setSupervisor(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)]"
                    placeholder={t.scientificProject.form.supervisorPlaceholder}
                  />
                </div>

                {/* City */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    {t.scientificProject.form.city}
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)]"
                    placeholder={t.scientificProject.form.cityPlaceholder}
                  />
                </div>
              </div>

              {/* Language */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  {t.scientificProject.form.language}
                </label>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {[
                    { val: "ru", label: "Русский" },
                    { val: "kz", label: "Қазақша" },
                    { val: "en", label: "English" },
                  ].map((opt) => (
                    <label
                      key={opt.val}
                      className={`flex cursor-pointer items-center justify-between rounded-xl border px-4 py-3 transition-all ${
                        language === opt.val
                          ? "border-[color:var(--primary)] bg-[color:var(--primary)]/5 ring-1 ring-[color:var(--primary)]"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="language"
                          value={opt.val}
                          checked={language === opt.val}
                          onChange={(e) => setLanguage(e.target.value as typeof language)}
                          className="h-4 w-4 text-[color:var(--primary)] focus:ring-[color:var(--primary)]"
                        />
                        <span className="text-sm font-medium text-slate-900">{opt.label}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600">
                  {error}
                </div>
              )}

              {/* Cost Info */}
              {costs.sciproject_create_plan && (
                <div className={`rounded-2xl border px-4 py-3 ${
                  checkBalance("sciproject_create_plan")
                    ? "border-green-200 bg-green-50"
                    : "border-orange-200 bg-orange-50"
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">
                      {t.tokens?.cost || "Стоимость"}:
                    </span>
                    <span className="text-sm font-bold text-slate-900">
                      {costs.sciproject_create_plan} {t.tokens?.balance || "токенов"}
                    </span>
                  </div>
                  {balance !== null && (
                    <div className="mt-1 flex items-center justify-between text-xs">
                      <span className="text-slate-600">
                        {t.tokens?.available || "Доступно"}: {balance}
                      </span>
                      {!checkBalance("sciproject_create_plan") && (
                        <span className="font-semibold text-orange-600">
                          {t.tokens?.insufficient || "Недостаточно токенов"}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Create Plan Button */}
              <button
                type="submit"
                disabled={loading || (balance !== null && !checkBalance("sciproject_create_plan"))}
                className="flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-[color:var(--primary)] to-[color:var(--secondary)] py-4 text-sm font-bold text-white shadow-lg transition hover:opacity-90 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent" />
                    {t.scientificProject.wizard.step1}
                  </>
                ) : (
                  t.scientificProject.wizard.createPlan
                )}
              </button>
            </form>
          </div>
        )}

        <ScientificProjectHistory />
      </div>
    </div>
  );
}


export default function ScientificProjectPage() {
  return (
    <Suspense fallback={<div className="min-h-96 animate-pulse rounded-3xl bg-white/70" />}>
      <ScientificProjectContent />
    </Suspense>
  );
}
