"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLanguage } from "@/i18n/LanguageContext";
import dynamic from "next/dynamic";
import CompetitionWorkspace from "@/features/pedagogical-competitions/CompetitionWorkspace";

const LessonIdeas = dynamic(() => import("@/features/pedagogical-competitions/LessonIdeas"));

function PedagogicalIdeasPage() {
  const { language } = useLanguage();
  const params = useSearchParams();
  const [mode, setMode] = useState<"competition" | "lesson">(params.has("job") ? "lesson" : "competition");
  return (
    <div className="mx-auto max-w-[1400px] pb-12">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs font-medium text-slate-500">Sandu AI <span className="mx-2 text-slate-300">/</span> {language === "kk" ? "Педагогикалық идея" : "Педагогическая идея"}</p>
        <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1" aria-label={language === "kk" ? "Жұмыс режимі" : "Режим работы"}>
          {(["competition", "lesson"] as const).map(value => <button type="button" key={value} aria-pressed={mode === value} onClick={() => setMode(value)} className={`min-h-9 rounded-lg px-4 text-xs font-semibold transition ${mode === value ? "bg-slate-900 text-white shadow-sm" : "text-slate-500 hover:bg-slate-50"}`}>{value === "competition" ? (language === "kk" ? "Байқауға дайындық" : "Подготовка к конкурсу") : (language === "kk" ? "Сабаққа идеялар" : "Идеи для урока")}</button>)}
        </div>
      </div>
      {mode === "competition" ? <CompetitionWorkspace /> : <LessonIdeas />}
    </div>
  );
}

export default function Page() {
  return <Suspense fallback={<div className="h-72 animate-pulse rounded-3xl bg-white" />}><PedagogicalIdeasPage /></Suspense>;
}
