"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useLanguage } from "../i18n/LanguageContext";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { language } = useLanguage();
  const isKazakh = language === "kk";

  useEffect(() => {
    // Keep the technical context in observability without exposing it to teachers.
    console.error("Unhandled application error", {
      digest: error.digest,
      name: error.name,
    });
  }, [error]);

  return (
    <main className="flex min-h-[70vh] items-center justify-center px-4 py-12">
      <section
        role="alert"
        className="w-full max-w-xl rounded-3xl border border-orange-100 bg-white p-7 text-center shadow-xl sm:p-10"
      >
        <div
          aria-hidden="true"
          className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-2xl"
        >
          ↻
        </div>
        <h1 className="mt-5 text-2xl font-bold text-slate-900">
          {isKazakh ? "Бетті ашу мүмкін болмады" : "Не удалось открыть страницу"}
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          {isKazakh
            ? "Енгізген деректеріңіз сақталды. Қайта көріңіз немесе басты бетке оралыңыз."
            : "Ваши введённые данные сохранены. Попробуйте ещё раз или вернитесь на главную."}
        </p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={reset}
            className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
          >
            {isKazakh ? "Қайта көру" : "Попробовать снова"}
          </button>
          <Link
            href="/dashboard"
            className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-orange-200 hover:text-orange-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500"
          >
            {isKazakh ? "Басты бетке оралу" : "Вернуться на главную"}
          </Link>
        </div>
      </section>
    </main>
  );
}
