"use client";

import { useTranslations } from "../../../i18n/LanguageContext";

export default function LibraryPage() {
  const t = useTranslations();
  return (
    <div className="glass-card rounded-3xl border border-white/60 px-6 py-6 shadow-md sm:px-8">
      <h2 className="text-lg font-semibold text-slate-900">{t.dashboard?.libraryPage?.title || "Библиотека материалов"}</h2>
      <p className="mt-2 text-sm text-slate-600">
        {t.dashboard?.libraryPage?.description || "Здесь будут курсы, наглядные пособия, интерактивные презентации и игры (Sketch Hub)."}
      </p>
    </div>
  );
}






