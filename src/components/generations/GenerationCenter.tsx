"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
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
    queryKey: generationJobsQueryKey,
    queryFn: () => listGenerationJobs(30),
    staleTime: 1_000,
    refetchOnReconnect: true,
    refetchOnWindowFocus: true,
    retry: 2,
    refetchInterval: (query) =>
      (query.state.data?.active_count ?? 0) > 0 ? 2_500 : 30_000,
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

  const activeCount = jobs.data?.active_count ?? 0;
  if (online && activeCount === 0) return null;

  return (
    <aside
      aria-live="polite"
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
        <p className="min-w-0 leading-5">
          {!online
            ? language === "kk"
              ? "Интернет өшірілді. Қабылданған жұмыстар серверде жалғасады."
              : "Интернет отключён. Принятые задания продолжаются на сервере."
            : language === "kk"
              ? `${activeCount} материал жасалып жатыр. Бетті жабуға болады.`
              : `Создаётся материалов: ${activeCount}. Страницу можно закрыть.`}
        </p>
      </div>
      <Link
        href="/dashboard/generations"
        className="shrink-0 rounded-full bg-white px-4 py-2 font-semibold text-slate-900 shadow-sm ring-1 ring-black/5 transition hover:-translate-y-0.5"
      >
        {language === "kk" ? "Менің материалдарым" : "Мои материалы"}
      </Link>
    </aside>
  );
}
