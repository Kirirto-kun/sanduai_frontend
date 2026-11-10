"use client";
import { GENERATION_POLL_RETRY_EVENT, generationPollingInterval, generationPollingRecovery } from "@/lib/generation-polling";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { GenerationJobStatus } from "./GenerationJobStatus";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { useLanguage } from "../../i18n/LanguageContext";
import {
  clearGenerationIntentForJob,
  GENERATION_JOBS_UPDATED_EVENT,
  listGenerationJobs,
} from "../../lib/api";
import { invalidateCachedBalance } from "../../lib/tokenCache";

export const generationJobsQueryKey = ["generation-jobs"] as const;

export function GenerationCenter() {
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const [online, setOnline] = useState(true);
  const previousStatuses = useRef<Map<string, string> | null>(null);
  const observedRefunds = useRef(new Set<string>());
  const jobs = useQuery({
    ...generationPollingRecovery,
    queryKey: generationJobsQueryKey,
    queryFn: () => listGenerationJobs(30),
    staleTime: 1_000,


    refetchInterval: (query) => generationPollingInterval(query.state, ((query.state.data?.active_count ?? 0) > 0 ? 2_500 : 30_000), query),
  });

  useEffect(() => {
    const updateOnline = () => setOnline(navigator.onLine);
    const refresh = () => {
      void queryClient.invalidateQueries({ queryKey: generationJobsQueryKey });
    };
    updateOnline();
    window.addEventListener("online", updateOnline);
    window.addEventListener("offline", updateOnline);
    window.addEventListener(GENERATION_JOBS_UPDATED_EVENT, refresh);
    return () => {
      window.removeEventListener("online", updateOnline);
      window.removeEventListener("offline", updateOnline);
      window.removeEventListener(GENERATION_JOBS_UPDATED_EVENT, refresh);
    };
  }, [queryClient]);

  useEffect(() => {
    if (!jobs.data) return;
    for (const job of jobs.data.items) {
      if (["completed", "failed", "cancelled", "billing_error"].includes(job.status)) {
        clearGenerationIntentForJob(job.id);
      }
    }
    const nextStatuses = new Map(
      jobs.data.items.map((job) => [job.id, job.status]),
    );
    const previous = previousStatuses.current;
    const newlyObservedRefund = jobs.data.items.some((job) => {
      if (job.billing_status !== "refunded" || observedRefunds.current.has(job.id)) return false;
      observedRefunds.current.add(job.id);
      return true;
    });
    if (previous) {
      const becameTerminal = jobs.data.items.some((job) => {
        const before = previous.get(job.id);
        return (
          before !== undefined &&
          !["completed", "failed", "cancelled", "billing_error"].includes(before) &&
          ["completed", "failed", "cancelled", "billing_error"].includes(job.status)
        );
      });
      if (becameTerminal || newlyObservedRefund) invalidateCachedBalance();
    } else if (newlyObservedRefund) {
      invalidateCachedBalance();
    }
    previousStatuses.current = nextStatuses;
  }, [jobs.data]);

  const pollError = useSyncExternalStore(
    (notify) => queryClient.getQueryCache().subscribe(notify),
    () => queryClient.getQueryCache().findAll({ predicate: (query) => query.isActive() && query.meta?.generationPolling === true }).find(query => query.state.error)?.state.error ?? null,
    () => null,
  );
  const retryPolling = () => {
    void queryClient.invalidateQueries({ predicate: (query) => query.meta?.generationPolling === true });
    window.dispatchEvent(new Event(GENERATION_POLL_RETRY_EVENT));
  };
  const activeCount = jobs.data?.active_count ?? 0;
  const activeJob = jobs.data?.items.find(job => ["queued", "running", "settling", "refunding"].includes(job.status));
  if (online && activeCount === 0 && !pollError) return null;

  return (
    <aside
      className={`mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-sm shadow-sm ${
        online
          ? "border-sky-200 bg-sky-50 text-sky-950"
          : "border-amber-200 bg-amber-50 text-amber-950"
      }`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className={online ? "animate-pulse" : ""} aria-hidden="true">
          {online ? "✨" : "📡"}
        </span>
        <p role="status" className="min-w-0 leading-5">
          {!online
            ? language === "kk"
              ? "Интернет өшірілді. Қабылданған жұмыстар серверде жалғасады."
              : "Интернет отключён. Принятые задания продолжаются на сервере."
            : pollError ? (language === "kk" ? "Күйін жаңарту үшін байланыс қажет." : "Для обновления статуса требуется связь.")
            : language === "kk"
              ? `${activeCount} материал жасалып жатыр. Бетті жабуға болады.`
              : `Создаётся материалов: ${activeCount}. Страницу можно закрыть.`}
        </p>
      </div>
      {(activeJob || pollError) && <div className="w-full"><GenerationJobStatus job={activeJob} language={language} error={pollError} onRetry={retryPolling} /></div>}
      <Link
        href="/dashboard/generations"
        className="shrink-0 rounded-full bg-white px-4 py-2 font-semibold text-slate-900 shadow-sm ring-1 ring-black/5 transition hover:-translate-y-0.5"
      >
        {language === "kk" ? "Менің материалдарым" : "Мои материалы"}
      </Link>
    </aside>
  );
}
