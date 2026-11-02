"use client";

import Link from "next/link";
import { useLanguage } from "@/i18n/LanguageContext";

export function ZerdeEntryCard() {
  const { language } = useLanguage();
  const kk = language === "kk";

  return (
    <aside className="mb-6 flex flex-col gap-5 rounded-3xl border border-teal-200 bg-teal-50/95 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6" aria-labelledby="zerde-entry-title">
      <div className="flex items-start gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-teal-800" aria-hidden="true">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 3h6m-5 0v6l-5.8 9.1A2 2 0 0 0 5.9 21h12.2a2 2 0 0 0 1.7-2.9L14 9V3M8 15h8" />
            <path d="m10 18 .01.01M14 17l.01.01" />
          </svg>
        </span>
        <div>
          <p className="mb-1 text-xs font-semibold tracking-wide text-teal-800">2026–2027 · 2–8 {kk ? "сынып" : "классы"}</p>
          <h2 id="zerde-entry-title" className="text-lg font-bold text-slate-950">{kk ? "«Зерде» конкурсына дайындалыңыз" : "Готовитесь к конкурсу «Зерде»?"}</h2>
          <p className="mt-1 max-w-xl text-sm leading-6 text-slate-700">{kk ? "Идеядан қорғауға дейін: зерттеу жоспары, күнделік, құжаттар және ережеге сәйкестікті тексеру." : "От идеи до защиты: план исследования, дневник, документы и проверка по правилам конкурса."}</p>
        </div>
      </div>
      <Link href="/dashboard/ai/zerde" className="inline-flex min-h-11 shrink-0 items-center justify-center gap-3 rounded-xl bg-teal-800 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-teal-900 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-800">
        {kk ? "Зерде PRO ашу" : "Открыть Зерде PRO"}<span aria-hidden="true">→</span>
      </Link>
    </aside>
  );
}
