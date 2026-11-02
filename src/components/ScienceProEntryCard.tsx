"use client";

import Link from "next/link";
import { useLanguage } from "@/i18n/LanguageContext";

export function ScienceProEntryCard() {
  const { language } = useLanguage();
  const kk = language === "kk";
  return (
    <aside className="mb-5 flex flex-col gap-5 rounded-3xl border border-emerald-200 bg-[#f4f7f0] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6" aria-labelledby="science-pro-entry-title">
      <div className="flex items-start gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-emerald-900" aria-hidden="true">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 3h6m-5 0v6l-5.8 9.1A2 2 0 0 0 5.9 21h12.2a2 2 0 0 0 1.7-2.9L14 9V3M8 15h8M12 17v2m-1-1h2" />
          </svg>
        </span>
        <div>
          <p className="mb-1 text-xs font-semibold tracking-wide text-emerald-900">RESEARCH WORKSPACE · 8–12 {kk ? "сынып" : "классы"}</p>
          <h2 id="science-pro-entry-title" className="text-lg font-bold text-slate-950">{kk ? "Ғылыми жоба PRO" : "Научный проект PRO"}</h2>
          <p className="mt-1 max-w-xl text-sm leading-6 text-slate-700">{kk ? "Идеядан дәлелге дейін: 15 зерттеу режимі, нақты деректерді талдау, сараптама және қорғауға дайындық." : "От идеи к доказательствам: 15 режимов исследования, анализ своих данных, экспертиза и подготовка к защите."}</p>
        </div>
      </div>
      <Link href="/dashboard/ai/science-pro" className="inline-flex min-h-11 shrink-0 items-center justify-center gap-3 rounded-xl bg-emerald-900 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-950 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-900">
        {kk ? "Зерттеуді бастау" : "Начать исследование"}<span aria-hidden="true">→</span>
      </Link>
    </aside>
  );
}
