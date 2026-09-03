"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { generationJobsQueryKey } from "@/components/generations/GenerationCenter";
import { useTokens } from "@/hooks/useTokens";
import { useLanguage } from "@/i18n/LanguageContext";
import {
  GENERATION_JOBS_UPDATED_EVENT,
  enqueueGenerationJob,
  getGenerationJob,
  listGenerationJobs,
  type GenerationJob,
  type GenerationJobStatus,
  type GenerationJobSummary,
} from "@/lib/api";
import {
  generationJobIdFromSearchParam,
  generationServerStatusCopy,
  isAcknowledgedGenerationJob,
  isUnavailableGenerationJobError,
} from "@/lib/generation-history";
import {
  downloadPedagogicalIdeas,
  pedagogicalIdeasResultFromJob,
  type PedagogicalIdea,
  type PedagogicalIdeasResult,
} from "@/lib/pedagogical-ideas";
import { teacherFacingErrorMessage } from "@/lib/teacher-facing-error";

const KIND = "pedagogical_idea.generate";
const SOURCE_PATH = "/dashboard/ai/pedagogical-ideas";
const TERMINAL_STATUSES: GenerationJobStatus[] = ["completed", "failed", "cancelled", "billing_error"];

const COPY = {
  kk: {
    eyebrow: "Жаңа ЖИ көмекші",
    title: "Педагогикалық идея генераторы",
    description: "Тақырыпты жазыңыз — сабаққа ерекше әдістер, дайын тапсырмалар және бағалау тәсілдерін ұсынамыз.",
    subject: "Пән",
    subjectPlaceholder: "Мысалы: Математика",
    grade: "Сынып",
    gradePlaceholder: "Сыныпты таңдаңыз",
    topic: "Сабақ тақырыбы",
    topicPlaceholder: "Мысалы: Жай бөлшектерді қосу",
    submit: "Сабақ идеяларын ұсыну",
    submitting: "Басталып жатыр…",
    required: "Пәнді, сыныпты және сабақ тақырыбын толтырыңыз.",
    insufficient: "Монета жеткіліксіз.",
    readyHint: "Нәтиже осы жерде ашылады",
    readyText: "ЖИ бірнеше түрлі әдісті салыстырып, бірден қолдануға болатын тапсырмалар дайындайды.",
    working: "Сабақ идеялары жасалып жатыр",
    workingHint: "Бетті жабуға немесе жаңартуға болады — жұмыс серверде жалғасады және осы жерден қайта ашылады.",
    failed: "Идеяларды жасау аяқталмады. Монеталар автоматты түрде қайтарылады.",
    retry: "Қайта жасау",
    goal: "Сабақ мақсаты",
    flow: "Ұсынылатын сабақ барысы",
    minutes: "мин",
    hook: "Қызықты бастама",
    why: "Неліктен тиімді",
    method: "Әдіс",
    teacher: "Мұғалім не істейді?",
    students: "Оқушылар не істейді?",
    materials: "Қажетті материалдар",
    tasks: "Дайын тапсырмалар",
    expected: "Күтілетін нәтиже",
    criteria: "Бағалау критерийлері",
    support: "Қолдау",
    challenge: "Күрделендіру",
    assessment: "Қалыптастырушы бағалау",
    reflection: "Рефлексия сұрағы",
    download: "Word жүктеу",
    history: "Менің идеяларым",
    historyHint: "Бұрын жасаған сабақ идеяларыңыз осы жерде сақталады.",
    empty: "Әзірге жасалған идея жоқ.",
    open: "Ашу",
    creating: "Жасалып жатыр",
    completed: "Дайын",
    cancelled: "Тоқтатылды",
    brokenResult: "Нәтижені ашу мүмкін болмады. Қайта жасап көріңіз.",
    wrongJob: "Бұл материал басқа бөлімде жасалған.",
  },
  ru: {
    eyebrow: "Новый ИИ-помощник",
    title: "Генератор педагогических идей",
    description: "Укажите тему — предложим необычные методы, готовые задания и способы оценивания для урока.",
    subject: "Предмет",
    subjectPlaceholder: "Например: Математика",
    grade: "Класс",
    gradePlaceholder: "Выберите класс",
    topic: "Тема урока",
    topicPlaceholder: "Например: Сложение обыкновенных дробей",
    submit: "Предложить идеи для урока",
    submitting: "Запускаем…",
    required: "Заполните предмет, класс и тему урока.",
    insufficient: "Недостаточно монет.",
    readyHint: "Результат появится здесь",
    readyText: "ИИ сравнит несколько разных методик и подготовит задания, которые можно сразу провести в классе.",
    working: "Создаём идеи для урока",
    workingHint: "Страницу можно закрыть или обновить — работа продолжится на сервере и снова откроется здесь.",
    failed: "Не удалось завершить работу. Монеты вернутся автоматически.",
    retry: "Создать заново",
    goal: "Цель урока",
    flow: "Рекомендуемый ход урока",
    minutes: "мин",
    hook: "Яркое начало",
    why: "Почему это работает",
    method: "Метод",
    teacher: "Что делает учитель?",
    students: "Что делают ученики?",
    materials: "Материалы",
    tasks: "Готовые задания",
    expected: "Ожидаемый результат",
    criteria: "Критерии успеха",
    support: "Поддержка",
    challenge: "Усложнение",
    assessment: "Формативное оценивание",
    reflection: "Вопрос для рефлексии",
    download: "Скачать Word",
    history: "Мои идеи",
    historyHint: "Здесь сохраняются ранее созданные идеи для уроков.",
    empty: "Созданных идей пока нет.",
    open: "Открыть",
    creating: "Создаётся",
    completed: "Готово",
    cancelled: "Остановлено",
    brokenResult: "Не удалось открыть результат. Попробуйте создать его заново.",
    wrongJob: "Этот материал создан в другом разделе.",
  },
} as const;

function dateLabel(value: string, language: "kk" | "ru"): string {
  return new Intl.DateTimeFormat(language === "kk" ? "kk-KZ" : "ru-RU", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function statusLabel(status: GenerationJobStatus, language: "kk" | "ru"): string {
  const copy = COPY[language];
  if (status === "completed" || status === "billing_error") return copy.completed;
  if (status === "failed" || status === "cancelled") return copy.cancelled;
  return copy.creating;
}

function PedagogicalIdeasContent() {
  const { language } = useLanguage();
  const copy = COPY[language];
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { balance, costs, refreshBalance } = useTokens();
  const requestedJobId = generationJobIdFromSearchParam(searchParams.get("job"));
  const [subject, setSubject] = useState("");
  const [grade, setGrade] = useState("");
  const [topic, setTopic] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const history = useQuery({
    queryKey: [...generationJobsQueryKey, KIND],
    queryFn: () => listGenerationJobs({ kind: KIND, limit: 100, offset: 0 }),
    staleTime: 1_000,
    refetchOnReconnect: true,
    refetchOnWindowFocus: true,
    refetchInterval: (query) =>
      query.state.data?.items.some((job) => job.kind === KIND && !TERMINAL_STATUSES.includes(job.status))
        ? 2_000
        : 30_000,
  });
  const jobs = useMemo(
    () => (history.data?.items ?? []).filter((job) => job.kind === KIND),
    [history.data?.items],
  );
  const current = useQuery({
    queryKey: ["generation-job", requestedJobId],
    queryFn: () => getGenerationJob(requestedJobId as string),
    enabled: Boolean(requestedJobId),
    retry: (failureCount, requestError) =>
      !isUnavailableGenerationJobError(requestError) && failureCount < 2,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status && !TERMINAL_STATUSES.includes(status) ? 1_800 : false;
    },
    refetchOnReconnect: true,
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if (requestedJobId || history.isLoading) return;
    const active = jobs.find((job) => !TERMINAL_STATUSES.includes(job.status));
    if (active) router.replace(`${SOURCE_PATH}?job=${active.id}`, { scroll: false });
  }, [history.isLoading, jobs, requestedJobId, router]);

  useEffect(() => {
    const refresh = () => {
      void queryClient.invalidateQueries({ queryKey: generationJobsQueryKey });
      if (requestedJobId) {
        void queryClient.invalidateQueries({ queryKey: ["generation-job", requestedJobId] });
      }
    };
    window.addEventListener(GENERATION_JOBS_UPDATED_EVENT, refresh);
    return () => window.removeEventListener(GENERATION_JOBS_UPDATED_EVENT, refresh);
  }, [queryClient, requestedJobId]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);
    if (!subject.trim() || !grade.trim() || !topic.trim()) {
      setFormError(copy.required);
      return;
    }
    const cost = costs.pedagogical_idea_generate ?? 10;
    if (balance !== null && balance < cost) {
      setFormError(copy.insufficient);
      return;
    }
    setIsSubmitting(true);
    try {
      const job = await enqueueGenerationJob(
        KIND,
        { subject: subject.trim(), grade, topic: topic.trim(), language },
        { title: topic.trim() },
      );
      queryClient.setQueryData(["generation-job", job.id], job);
      void queryClient.invalidateQueries({ queryKey: generationJobsQueryKey });
      router.replace(`${SOURCE_PATH}?job=${job.id}`, { scroll: false });
      void refreshBalance();
    } catch (error) {
      setFormError(teacherFacingErrorMessage(error, language));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownload = async (job: GenerationJob | GenerationJobSummary) => {
    setFormError(null);
    try {
      const fullJob = "result" in job ? job : await getGenerationJob(job.id);
      const result = pedagogicalIdeasResultFromJob(fullJob);
      if (!result) throw new Error("invalid_result");
      downloadPedagogicalIdeas(result, language);
    } catch (error) {
      setFormError(error instanceof Error && error.message === "invalid_result"
        ? copy.brokenResult
        : teacherFacingErrorMessage(error, language));
    }
  };

  const selectedJob = current.data;
  const selectedResult = pedagogicalIdeasResultFromJob(selectedJob);
  const wrongKind = Boolean(selectedJob && selectedJob.kind !== KIND);
  const selectedJobAcknowledged = isAcknowledgedGenerationJob(
    selectedJob,
    requestedJobId,
    [KIND],
  );
  const unavailableJob = current.isError && isUnavailableGenerationJobError(current.error);

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-12">
      <header className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#30205f] via-[#5536ad] to-[#8962ee] px-6 py-8 text-white shadow-xl sm:px-10">
        <div className="max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-violet-200">✨ {copy.eyebrow}</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">{copy.title}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-violet-100 sm:text-base">{copy.description}</p>
        </div>
      </header>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(310px,0.72fr)_minmax(0,1.55fr)]">
        <form onSubmit={handleSubmit} className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6 xl:sticky xl:top-24">
          <div className="space-y-5">
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-800">{copy.subject}</span>
              <input
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                maxLength={100}
                placeholder={copy.subjectPlaceholder}
                className="min-h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-base text-slate-950 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-800">{copy.grade}</span>
              <select
                value={grade}
                onChange={(event) => setGrade(event.target.value)}
                className="min-h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-base text-slate-950 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
              >
                <option value="">{copy.gradePlaceholder}</option>
                {Array.from({ length: 11 }, (_, index) => String(index + 1)).map((value) => (
                  <option key={value} value={value}>{value}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-800">{copy.topic}</span>
              <textarea
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
                maxLength={300}
                rows={4}
                placeholder={copy.topicPlaceholder}
                className="w-full resize-none rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-950 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
              />
            </label>
          </div>

          {formError && (
            <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800" role="alert">
              {formError}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-5 min-h-13 w-full rounded-2xl bg-gradient-to-r from-violet-700 to-fuchsia-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-violet-200 transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-wait disabled:opacity-60"
          >
            {isSubmitting ? copy.submitting : copy.submit}
          </button>
        </form>

        <section className="min-w-0 rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          {!requestedJobId ? (
            <EmptyResult title={copy.readyHint} text={copy.readyText} />
          ) : current.isLoading ? (
            <LoadingResult
              copy={copy}
              statusHint={generationServerStatusCopy(language, false)}
            />
          ) : current.isError ? (
            <ErrorResult
              message={unavailableJob
                ? language === "kk"
                  ? "Бұл тапсырма енді қолжетімді емес. Жаңа идеялар жасап көріңіз."
                  : "Эта задача больше недоступна. Создайте новые идеи."
                : teacherFacingErrorMessage(current.error, language)}
              retry={unavailableJob
                ? () => router.replace(SOURCE_PATH)
                : () => void current.refetch()}
              label={copy.retry}
            />
          ) : wrongKind ? (
            <ErrorResult message={copy.wrongJob} retry={() => router.replace(SOURCE_PATH)} label={copy.retry} />
          ) : !selectedJob ? (
            <EmptyResult title={copy.readyHint} text={copy.readyText} />
          ) : !TERMINAL_STATUSES.includes(selectedJob.status) ? (
            <LoadingResult
              copy={copy}
              job={selectedJob}
              statusHint={generationServerStatusCopy(language, selectedJobAcknowledged)}
            />
          ) : selectedJob.status === "failed" || selectedJob.status === "cancelled" ? (
            <ErrorResult message={copy.failed} retry={() => router.replace(SOURCE_PATH)} label={copy.retry} />
          ) : selectedResult ? (
            <IdeasResult result={selectedResult} language={language} onDownload={() => void handleDownload(selectedJob)} />
          ) : (
            <ErrorResult message={copy.brokenResult} retry={() => router.replace(SOURCE_PATH)} label={copy.retry} />
          )}
        </section>
      </div>

      <section className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-black text-slate-950">{copy.history}</h2>
            <p className="mt-1 text-sm text-slate-600">{copy.historyHint}</p>
          </div>
          <Link href="/dashboard/generations" className="text-sm font-bold text-violet-700 hover:text-violet-900">
            {language === "kk" ? "Барлық материал" : "Все материалы"} →
          </Link>
        </div>

        {history.isLoading ? (
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2].map((item) => <div key={item} className="h-28 animate-pulse rounded-2xl bg-slate-100" />)}
          </div>
        ) : jobs.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">{copy.empty}</div>
        ) : (
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {jobs.slice(0, 12).map((job) => {
              const ready = job.status === "completed" || job.status === "billing_error";
              return (
                <article key={job.id} className="flex min-h-32 flex-col rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="line-clamp-2 font-bold text-slate-950">{job.title}</h3>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                      ready ? "bg-emerald-100 text-emerald-800" : TERMINAL_STATUSES.includes(job.status) ? "bg-rose-100 text-rose-800" : "bg-violet-100 text-violet-800"
                    }`}>
                      {statusLabel(job.status, language)}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">{dateLabel(job.created_at, language)}</p>
                  <div className="mt-auto flex gap-2 pt-4">
                    <Link href={`${SOURCE_PATH}?job=${job.id}`} className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white">
                      {copy.open}
                    </Link>
                    {ready && (
                      <button type="button" onClick={() => void handleDownload(job)} className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-800">
                        {copy.download}
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

export default function PedagogicalIdeasPage() {
  return (
    <Suspense
      fallback={(
        <div className="mx-auto max-w-6xl px-4 py-8" role="status" aria-label="Loading">
          <div className="h-64 animate-pulse rounded-3xl bg-white/80 shadow-sm" />
        </div>
      )}
    >
      <PedagogicalIdeasContent />
    </Suspense>
  );
}

function EmptyResult({ title, text }: { title: string; text: string }) {
  return (
    <div className="flex min-h-[420px] flex-col items-center justify-center px-4 text-center">
      <div className="grid size-20 place-items-center rounded-3xl bg-violet-100 text-4xl" aria-hidden="true">💡</div>
      <h2 className="mt-5 text-2xl font-black text-slate-950">{title}</h2>
      <p className="mt-2 max-w-lg text-sm leading-6 text-slate-600">{text}</p>
    </div>
  );
}

function LoadingResult({
  copy,
  job,
  statusHint,
}: {
  copy: typeof COPY.kk | typeof COPY.ru;
  job?: GenerationJob;
  statusHint: string;
}) {
  const current = Number(job?.progress.current ?? 0);
  const total = Math.max(1, Number(job?.progress.total ?? 1));
  const progress = Math.max(8, Math.min(94, (current / total) * 100));
  return (
    <div className="flex min-h-[420px] flex-col items-center justify-center px-4 text-center" aria-live="polite">
      <div className="relative size-20">
        <div className="absolute inset-0 animate-ping rounded-full bg-violet-200 opacity-60" />
        <div className="relative grid size-20 place-items-center rounded-full bg-violet-700 text-3xl text-white">✦</div>
      </div>
      <h2 className="mt-6 text-2xl font-black text-slate-950">{copy.working}</h2>
      <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">{statusHint}</p>
      <div className="mt-6 h-2 w-full max-w-md overflow-hidden rounded-full bg-violet-100">
        <div className="h-full animate-pulse rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500 transition-[width] duration-500" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}

function ErrorResult({ message, retry, label }: { message: string; retry: () => void; label: string }) {
  return (
    <div className="flex min-h-[420px] flex-col items-center justify-center px-4 text-center">
      <div className="grid size-16 place-items-center rounded-2xl bg-rose-100 text-2xl" aria-hidden="true">↻</div>
      <p className="mt-5 max-w-lg font-semibold leading-6 text-slate-800">{message}</p>
      <button type="button" onClick={retry} className="mt-5 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white">{label}</button>
    </div>
  );
}

function IdeasResult({ result, language, onDownload }: { result: PedagogicalIdeasResult; language: "kk" | "ru"; onDownload: () => void }) {
  const copy = COPY[language];
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selected = result.ideas[Math.min(selectedIndex, result.ideas.length - 1)];
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-violet-700">{copy.completed}</p>
          <h2 className="mt-1 text-2xl font-black text-slate-950 sm:text-3xl">{result.title}</h2>
          <div className="mt-4 rounded-2xl bg-violet-50 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-violet-700">{copy.goal}</p>
            <p className="mt-1 text-sm leading-6 text-slate-800">{result.lesson_goal}</p>
          </div>
        </div>
        <button type="button" onClick={onDownload} className="rounded-2xl border border-violet-200 bg-white px-4 py-2.5 text-sm font-bold text-violet-800 shadow-sm">
          ↓ {copy.download}
        </button>
      </div>

      <section>
        <h3 className="text-lg font-black text-slate-950">{copy.flow}</h3>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {result.recommended_flow.map((step, index) => (
            <div key={`${step.stage}-${index}`} className="rounded-2xl border border-slate-200 p-3">
              <div className="flex items-center justify-between gap-3">
                <span className="font-bold text-slate-900">{step.stage}</span>
                <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">{step.duration_minutes} {copy.minutes}</span>
              </div>
              <p className="mt-2 text-sm leading-5 text-slate-600">{step.action}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label={copy.tasks}>
        {result.ideas.map((idea, index) => (
          <button
            key={idea.title}
            type="button"
            role="tab"
            aria-selected={selectedIndex === index}
            onClick={() => setSelectedIndex(index)}
            className={`shrink-0 rounded-2xl px-4 py-2.5 text-sm font-bold transition ${selectedIndex === index ? "bg-violet-700 text-white shadow-md" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
          >
            {index + 1}. {idea.title}
          </button>
        ))}
      </div>

      <IdeaDetails idea={selected} copy={copy} />
    </div>
  );
}

function IdeaDetails({ idea, copy }: { idea: PedagogicalIdea; copy: typeof COPY.kk | typeof COPY.ru }) {
  return (
    <article className="space-y-5 rounded-3xl border border-violet-100 bg-gradient-to-b from-violet-50/70 to-white p-5 sm:p-6">
      <div>
        <h3 className="text-2xl font-black text-slate-950">{idea.title}</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <InfoCard title={copy.hook} text={idea.hook} icon="⚡" />
          <InfoCard title={copy.why} text={idea.why_it_works} icon="✓" />
        </div>
      </div>

      <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <p className="text-xs font-bold uppercase tracking-wide text-violet-700">{copy.method}</p>
        <h4 className="mt-1 text-xl font-black text-slate-950">{idea.method.name}</h4>
        <p className="mt-2 text-sm leading-6 text-slate-600">{idea.method.purpose}</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <BulletList title={copy.teacher} items={idea.method.teacher_actions} />
          <BulletList title={copy.students} items={idea.method.student_actions} />
        </div>
        {idea.method.materials.length > 0 && <BulletList title={copy.materials} items={idea.method.materials} compact />}
      </section>

      <section>
        <h4 className="text-lg font-black text-slate-950">{copy.tasks}</h4>
        <div className="mt-3 space-y-3">
          {idea.tasks.map((task, index) => (
            <div key={`${task.title}-${index}`} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h5 className="font-black text-slate-950">{index + 1}. {task.title}</h5>
                <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-900">{task.work_format} · {task.duration_minutes} {copy.minutes}</span>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-700">{task.instruction}</p>
              <div className="mt-3 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-950"><strong>{copy.expected}:</strong> {task.expected_result}</div>
              <BulletList title={copy.criteria} items={task.success_criteria} compact />
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <div className="rounded-xl bg-sky-50 p-3 text-sm text-sky-950"><strong>{copy.support}:</strong> {task.differentiation.support}</div>
                <div className="rounded-xl bg-fuchsia-50 p-3 text-sm text-fuchsia-950"><strong>{copy.challenge}:</strong> {task.differentiation.challenge}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2">
        <InfoCard title={copy.assessment} text={idea.formative_assessment} icon="◎" />
        <InfoCard title={copy.reflection} text={idea.reflection_question} icon="?" />
      </div>
    </article>
  );
}

function InfoCard({ title, text, icon }: { title: string; text: string; icon: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-2 text-sm font-black text-slate-950"><span className="grid size-7 place-items-center rounded-lg bg-violet-100 text-violet-800">{icon}</span>{title}</div>
      <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
    </div>
  );
}

function BulletList({ title, items, compact = false }: { title: string; items: string[]; compact?: boolean }) {
  return (
    <div className={compact ? "mt-3" : ""}>
      <h5 className="text-sm font-black text-slate-900">{title}</h5>
      <ul className="mt-2 space-y-1.5">
        {items.map((item, index) => (
          <li key={`${item}-${index}`} className="flex gap-2 text-sm leading-5 text-slate-600"><span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-violet-500" />{item}</li>
        ))}
      </ul>
    </div>
  );
}
