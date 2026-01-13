"use client";

import Link from "next/link";
import { useTranslations } from "../../../../i18n/LanguageContext";

export default function LibraryGamesPage() {
  const t = useTranslations();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Интерактивные игры</h1>
        <p className="text-sm text-slate-600 mt-1">
          Выберите игру для использования на уроке
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link
          href="/dashboard/library/games/at-zharys"
          className="glass-card rounded-3xl border border-white/60 p-6 shadow-md transition hover:shadow-lg hover:scale-105"
        >
          <div className="mb-4 text-4xl">🐴</div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Ат Жарыс</h3>
          <p className="text-sm text-slate-600">
            Интерактивная игра-викторина с гонкой лошадей. Команды соревнуются, отвечая на вопросы.
          </p>
        </Link>
      </div>
    </div>
  );
}





