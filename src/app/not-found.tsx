"use client";

import Link from "next/link";

import { useLanguage } from "@/i18n/LanguageContext";

const NOT_FOUND_COPY = {
  ru: {
    title: "Страница не найдена",
    description: "Возможно, ссылка устарела или страница была перенесена.",
    back: "Вернуться на главную",
  },
  kk: {
    title: "Бет табылмады",
    description: "Сілтеме ескірген немесе бет басқа мекенжайға көшірілген болуы мүмкін.",
    back: "Басты бетке оралу",
  },
} as const;

export default function NotFound() {
  const { language } = useLanguage();
  const copy = NOT_FOUND_COPY[language];

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <section className="w-full max-w-xl rounded-3xl border border-orange-100 bg-white p-8 text-center shadow-xl sm:p-12">
        <p className="text-sm font-bold uppercase tracking-[0.22em] text-orange-600">404</p>
        <h1 className="mt-3 text-3xl font-bold text-slate-900">{copy.title}</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">{copy.description}</p>
        <Link
          href="/dashboard"
          className="mt-7 inline-flex rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          {copy.back}
        </Link>
      </section>
    </main>
  );
}
