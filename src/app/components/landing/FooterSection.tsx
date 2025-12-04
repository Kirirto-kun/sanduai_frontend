"use client";

import { FormEvent, useState } from "react";
import { useTranslations } from "../../../i18n/LanguageContext";

export function FooterSection() {
  const t = useTranslations();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitted(true);
  };

  return (
    <footer className="border-t border-slate-200/70 bg-white/90 pb-8 pt-10">
      <div className="section-container space-y-8">
        <div className="section-grid items-center gap-6">
          <div className="space-y-3">
            <h2 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
              {t.footer.ctaTitle}
            </h2>
            <p className="text-sm leading-relaxed text-slate-600">
              {t.footer.ctaSubtitle}
            </p>
          </div>
          <form
            onSubmit={onSubmit}
            className="flex flex-col gap-3 sm:flex-row sm:items-center"
          >
            <div className="flex-1">
              <div className="flex rounded-full bg-slate-50 p-1 ring-1 ring-slate-200 focus-within:ring-2 focus-within:ring-[color:var(--primary)]">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-full border-0 bg-transparent px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0"
                  placeholder={t.footer.emailPlaceholder}
                />
              </div>
            </div>
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-full bg-[color:var(--secondary)] px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-500/30 transition hover:bg-emerald-600 hover:shadow-lg"
            >
              {t.footer.ctaButton}
            </button>
          </form>
        </div>
        {submitted && (
          <p className="text-xs text-emerald-700">
            Email сохранён локально. Интеграция с рассылкой будет добавлена
            позже.
          </p>
        )}
        <div className="flex flex-col justify-between gap-2 border-t border-slate-100 pt-4 text-xs text-slate-500 sm:flex-row sm:items-center">
          <span>{t.footer.rights}</span>
        </div>
      </div>
    </footer>
  );
}


