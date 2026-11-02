"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { useLanguage } from "@/i18n/LanguageContext";
import { readIntegrationPrefill } from "@/lib/integration-prefill";
import { getVideoHandoff } from "@/features/pedagogical-competitions/api";
import { useAuth } from "@/contexts/AuthContext";
import { teacherFacingErrorMessage } from "@/lib/teacher-facing-error";
import { useMasterclassHandoff } from "@/features/masterclasses/useMasterclassHandoff";
import { MasterclassHandoffNotice } from "@/features/masterclasses/MasterclassHandoffNotice";
import { VideoWorkspace } from "@/features/video-generation/VideoWorkspace";
import { canAccessVideoGeneration } from "@/lib/access-policy";

function VideoContent() {
  const { language } = useLanguage();
  const searchParams = useSearchParams();
  const prefill = useMemo(
    () => readIntegrationPrefill(searchParams),
    [searchParams],
  );
  const { user } = useAuth();
  const sourceWork = searchParams.get("competitionWork");
  const masterclass = useMasterclassHandoff(
    "video",
    !sourceWork && !searchParams.has("job") && !searchParams.has("project"),
  );
  const handoff = useQuery({
    queryKey: ["competition-video-handoff", sourceWork, user?.userId],
    queryFn: () => getVideoHandoff(sourceWork!),
    enabled: Boolean(sourceWork && user?.userId),
    retry: false,
  });
  const isKk = language === "kk";
  const payload = handoff.data?.payload;
  const prompt = payload
    ? `${payload.title}\n\n${payload.requirements}\n\n${payload.scenes.map((scene) => `${scene.number}. ${scene.duration_seconds} ${isKk ? "сек" : "сек"}\n${scene.visual}\n${scene.narration}\n${scene.on_screen_text}\n${isKk ? "Дәлелдер" : "Доказательства"}: ${scene.evidence.join("; ")}`).join("\n\n")}`
    : (masterclass.payload?.prompt ??
      (searchParams.has("masterclassWork") ? "" : prefill.prompt));

  return (
    <div>
      <MasterclassHandoffNotice handoff={masterclass} />
      {handoff.isLoading && sourceWork && (
        <p className="mt-6 text-center text-sm text-slate-500">
          {isKk
            ? "Толық бейнежоспар жүктелуде…"
            : "Загружаем полный видеоплан…"}
        </p>
      )}
      {handoff.isError && (
        <p
          role="alert"
          className="mt-6 rounded-xl bg-rose-50 p-4 text-sm text-rose-700"
        >
          {teacherFacingErrorMessage(handoff.error, language)}
        </p>
      )}
      {payload && (
        <Link
          href={`/dashboard/ai/pedagogical-ideas?work=${encodeURIComponent(payload.source_work_id)}`}
          className="mb-5 inline-flex text-xs font-semibold text-indigo-600"
        >
          {isKk ? "← Авторлық жұмысқа оралу" : "← Вернуться к авторской работе"}
        </Link>
      )}
      <VideoWorkspace
        initialPrompt={prompt}
        requestedProject={searchParams.get("project")}
      />
    </div>
  );
}

export default function VideoPage() {
  const { user, loading } = useAuth();
  const { language } = useLanguage();

  if (loading) return <p role="status">{language === "kk" ? "Қолжетімділік тексерілуде…" : "Проверяем доступ…"}</p>;
  if (!canAccessVideoGeneration(user?.role)) {
    return (
      <section role="status" className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white px-6 py-12 text-center">
        <h1 className="text-xl font-semibold text-slate-900">{language === "kk" ? "Видео генерациясы әзірге тек әкімшіге қолжетімді" : "Генерация видео пока доступна только администратору"}</h1>
        <Link href="/dashboard" className="mt-5 inline-flex min-h-11 items-center font-semibold text-[color:var(--primary)]">{language === "kk" ? "Басты бетке оралу" : "Вернуться на главную"}</Link>
      </section>
    );
  }
  return (
    <Suspense
      fallback={
        <div className="min-h-80 animate-pulse rounded-3xl bg-white/70" />
      }
    >
      <VideoContent />
    </Suspense>
  );
}
