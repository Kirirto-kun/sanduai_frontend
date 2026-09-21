"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";

import { useLanguage } from "@/i18n/LanguageContext";
import { contentLanguageLabel } from "@/lib/content-languages";
import { readIntegrationPrefill } from "@/lib/integration-prefill";

function VideoContent() {
  const { language } = useLanguage();
  const searchParams = useSearchParams();
  const prefill = useMemo(() => readIntegrationPrefill(searchParams), [searchParams]);
  const [copied, setCopied] = useState(false);
  const isKk = language === "kk";

  const copyPrompt = async () => {
    if (!prefill.prompt) return;
    await navigator.clipboard.writeText(prefill.prompt);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1_800);
  };

  return (
    <div className="mx-auto max-w-3xl rounded-3xl border border-white/70 bg-white px-6 py-10 shadow-md sm:px-8">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-sky-50 text-2xl">🎬</div>
      <div className="mt-5 text-center">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-sky-600">SANDU AI · VIDEO</p>
        <h1 className="mt-2 text-2xl font-black text-slate-900">{isKk ? "Видео жасау" : "Создание видео"}</h1>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">
          {isKk ? "Видео генераторымен тікелей байланыс әзірленуде. Тапсырма мәтіні жоғалмай сақталды — оны көшіруге болады." : "Прямая генерация видео находится в разработке. Запрос из занятия сохранён — его можно скопировать без потери контекста."}
        </p>
      </div>
      {prefill.prompt ? (
        <section className="mt-7 rounded-2xl border border-sky-200 bg-sky-50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-black text-sky-950">{isKk ? "Дайын видео сұрауы" : "Готовый запрос для видео"}</h2>
            {prefill.language ? <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-sky-700">{contentLanguageLabel(prefill.language)}</span> : null}
          </div>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">{prefill.prompt}</p>
          <button type="button" onClick={() => void copyPrompt()} className="mt-4 min-h-10 rounded-xl bg-sky-700 px-4 text-xs font-black text-white hover:bg-sky-800">
            {copied ? (isKk ? "Көшірілді ✓" : "Скопировано ✓") : (isKk ? "Сұрауды көшіру" : "Скопировать запрос")}
          </button>
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
