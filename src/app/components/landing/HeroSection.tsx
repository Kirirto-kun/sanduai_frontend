"use client";

import { useState, FormEvent } from "react";
import { useLanguage, useTranslations } from "../../../i18n/LanguageContext";

export function HeroSection() {
  const { language, setLanguage } = useLanguage();
  const t = useTranslations();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitted(true);
  };

  return (
    <section className="relative overflow-hidden pb-16 pt-10 sm:pt-14">
      <div className="section-container">
        <header className="mb-10 flex items-center justify-between gap-4">
          <span className="text-sm font-semibold uppercase tracking-[0.24em] text-[color:var(--primary)]">
            {t.common.brand}
          </span>
          <div className="inline-flex rounded-full bg-[rgba(255,255,255,0.8)] p-1 shadow-sm ring-1 ring-black/5">
            <button
              type="button"
              onClick={() => setLanguage("ru")}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition ${
                language === "ru"
                  ? "bg-[color:var(--primary)] text-white shadow"
                  : "text-slate-700 hover:bg-white/80"
              }`}
            >
              {t.common.ru}
            </button>
            <button
              type="button"
              onClick={() => setLanguage("kk")}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition ${
                language === "kk"
                  ? "bg-[color:var(--secondary)] text-white shadow"
                  : "text-slate-700 hover:bg-white/80"
              }`}
            >
              {t.common.kk}
            </button>
          </div>
        </header>

        <div className="glass-card relative rounded-3xl border border-white/60 px-6 py-10 shadow-xl sm:px-10 lg:px-14 lg:py-14">
          <div className="section-grid items-center">
            <div className="space-y-6">
              <p className="inline-flex items-center gap-2 rounded-full bg-[rgba(16,185,129,0.06)] px-3 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-100">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Платформа для учителей Казахстана
              </p>
              <h1 className="text-balance text-3xl font-semibold leading-tight tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
                {t.hero.title}
              </h1>
              <p className="max-w-xl text-balance text-sm leading-relaxed text-slate-600 sm:text-base">
                {t.hero.subtitle}
              </p>
              <form
                onSubmit={onSubmit}
                className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center"
              >
                <div className="flex-1">
                  <div className="flex rounded-full bg-white/90 p-1 ring-1 ring-slate-200 focus-within:ring-2 focus-within:ring-[color:var(--primary)]">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-full border-0 bg-transparent px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0"
                      placeholder={t.hero.emailPlaceholder}
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[color:var(--primary)] to-[color:var(--secondary)] px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-orange-500/30 transition hover:shadow-xl hover:shadow-emerald-500/30"
                >
                  {t.hero.ctaLabel}
                </button>
              </form>
              {submitted && (
                <p className="text-xs text-emerald-700">
                  Email сохранён локально. Интеграция с бэкендом будет добавлена
                  на следующих этапах.
                </p>
              )}
            </div>
            <div className="relative mt-8 rounded-2xl bg-gradient-to-br from-[color:var(--primary)]/90 via-amber-300/70 to-[color:var(--secondary)]/90 p-[1px] sm:mt-0 sm:h-64 lg:h-72">
              <div className="flex h-full flex-col justify-between rounded-2xl bg-white/95 p-4 text-[11px] text-slate-800 shadow-inner sm:p-5">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-amber-600">
                    ИИ-документы
                  </p>
                  <p className="mt-2 text-[13px] font-semibold leading-snug">
                    КМЖ, БЖБ, ТЖБ, ЭССЕ, жұмыс парақтары
                  </p>
                  <p className="mt-1 text-[11px] leading-snug text-slate-500">
                    Сформируйте полный пакет документов для четверти за вечер.
                  </p>
                </div>
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-1.5">
                    <span className="text-[10px] font-medium leading-snug">
                      БЖБ 7 класс, математика
                    </span>
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                      12 заданий
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-1.5">
                    <span className="text-[10px] font-medium leading-snug">
                      ТЖБ 9 класс, история
                    </span>
                    <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-semibold text-orange-700">
                      Готово
                    </span>
                  </div>
                  <div className="rounded-xl bg-slate-50 px-3 py-1.5">
                    <span className="block text-[10px] font-medium leading-snug">
                      Классный час «Құндылыққа негізделген адал азамат»
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


