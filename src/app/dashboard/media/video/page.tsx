"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { useLanguage } from "@/i18n/LanguageContext";
import { contentLanguageLabel } from "@/lib/content-languages";
import { readIntegrationPrefill } from "@/lib/integration-prefill";
import { getVideoHandoff } from "@/features/pedagogical-competitions/api";
import { useAuth } from "@/contexts/AuthContext";
import { teacherFacingErrorMessage } from "@/lib/teacher-facing-error";
import { useMasterclassHandoff } from "@/features/masterclasses/useMasterclassHandoff";
import { MasterclassHandoffNotice } from "@/features/masterclasses/MasterclassHandoffNotice";

function VideoContent() {
  const { language } = useLanguage();
  const searchParams = useSearchParams();
  const prefill = useMemo(() => readIntegrationPrefill(searchParams), [searchParams]);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const { user } = useAuth();
  const sourceWork = searchParams.get("competitionWork");
  const masterclass = useMasterclassHandoff("video", !sourceWork && !searchParams.has("job"));
  const handoff = useQuery({ queryKey: ["competition-video-handoff", sourceWork, user?.userId], queryFn: () => getVideoHandoff(sourceWork!), enabled: Boolean(sourceWork && user?.userId), retry: false });
  const isKk = language === "kk";
  const payload = handoff.data?.payload;
  const prompt = payload ? `${payload.title}\n\n${payload.requirements}\n\n${payload.scenes.map(scene => `${scene.number}. ${scene.duration_seconds} ${isKk ? "сек" : "сек"}\n${scene.visual}\n${scene.narration}\n${scene.on_screen_text}\n${isKk ? "Дәлелдер" : "Доказательства"}: ${scene.evidence.join("; ")}`).join("\n\n")}` : masterclass.payload?.prompt ?? (searchParams.has("masterclassWork") ? "" : prefill.prompt);
  const materialLanguage = payload?.language ?? masterclass.payload?.language ?? prefill.language;

  const copyPrompt = async () => {
    if (!prompt) return;
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true); setCopyError(false);
      window.setTimeout(() => setCopied(false), 1_800);
    } catch { setCopyError(true); }
  };

  return (
    <div className="mx-auto max-w-3xl rounded-3xl border border-white/70 bg-white px-6 py-10 shadow-md sm:px-8">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-sky-50 text-2xl">🎬</div>
      <div className="mt-5 text-center">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-sky-600">SANDU AI · VIDEO</p>
        <h1 className="mt-2 text-2xl font-black text-slate-900">{isKk ? "Видео жасау" : "Создание видео"}</h1>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">
          {isKk ? "Видео генераторымен тікелей байланыс әзірленуде. Толық бейнежоспарды көшіріп, түсірілімге дайындауға болады." : "Прямая генерация видео находится в разработке. Полный видеоплан можно скопировать и использовать для подготовки съёмки."}
        </p>
      </div>
      <MasterclassHandoffNotice handoff={masterclass} />
      {handoff.isLoading && sourceWork && <p className="mt-6 text-center text-sm text-slate-500">{isKk ? "Толық бейнежоспар жүктелуде…" : "Загружаем полный видеоплан…"}</p>}
      {handoff.isError && <p role="alert" className="mt-6 rounded-xl bg-rose-50 p-4 text-sm text-rose-700">{teacherFacingErrorMessage(handoff.error, language)}</p>}
      {payload && <Link href={`/dashboard/ai/pedagogical-ideas?work=${encodeURIComponent(payload.source_work_id)}`} className="mt-6 inline-flex text-xs font-semibold text-indigo-600">{isKk ? "← Авторлық жұмысқа оралу" : "← Вернуться к авторской работе"}</Link>}
      {prompt ? (
        <section className="mt-7 rounded-2xl border border-sky-200 bg-sky-50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-black text-sky-950">{isKk ? "Дайын видео сұрауы" : "Готовый запрос для видео"}</h2>
            {materialLanguage ? <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-sky-700">{contentLanguageLabel(materialLanguage)}</span> : null}
          </div>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">{prompt}</p>
          <button type="button" onClick={() => void copyPrompt()} className="mt-4 min-h-10 rounded-xl bg-sky-700 px-4 text-xs font-black text-white hover:bg-sky-800">
            {copied ? (isKk ? "Көшірілді ✓" : "Скопировано ✓") : (isKk ? "Сұрауды көшіру" : "Скопировать запрос")}
          </button>
          {copyError && <p role="alert" className="mt-2 text-xs text-rose-700">{isKk ? "Мәтінді белгілеп, қолмен көшіріңіз." : "Выделите текст и скопируйте вручную."}</p>}
        </section>
      ) : null}
    </div>
  );
}

export default function VideoPage() {
  return (
    <Suspense fallback={<div className="min-h-80 animate-pulse rounded-3xl bg-white/70" />}>
      <VideoContent />
    </Suspense>
  );
}
