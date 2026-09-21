"use client";

import { useLanguage } from "@/i18n/LanguageContext";

export default function GamesPage() {
  const { language } = useLanguage();
  return (
    <div className="glass-card rounded-3xl border border-white/60 px-6 py-12 shadow-md sm:px-8">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-slate-900">
          {language === "kk" ? "Ойындар (Kahoot)" : "Игры (Kahoot)"}
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          {language === "kk"
            ? "Бұл мүмкіндік әзірленіп жатыр және жақында қолжетімді болады."
            : "Эта функция находится в разработке и скоро будет доступна."}
        </p>
      </div>
    </div>
  );
}





