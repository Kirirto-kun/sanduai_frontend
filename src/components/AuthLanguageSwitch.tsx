"use client";

import { useLanguage } from "@/i18n/LanguageContext";

export function AuthLanguageSwitch() {
  const { language, setLanguage } = useLanguage();
  const groupLabel = language === "kk" ? "Интерфейс тілі" : "Язык интерфейса";

  return (
    <div
      role="group"
      aria-label={groupLabel}
      className="inline-flex rounded-full border border-slate-200 bg-white/80 p-1 shadow-sm"
    >
      {(["ru", "kk"] as const).map((option) => {
        const isSelected = language === option;
        const label = option === "ru" ? "RU" : "KZ";

        return (
          <button
            key={option}
            type="button"
            aria-label={option === "ru" ? "Русский" : "Қазақша"}
            aria-pressed={isSelected}
            onClick={() => setLanguage(option)}
            className={`min-h-11 min-w-11 rounded-full px-3 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 ${
              isSelected
                ? "bg-[color:var(--primary)] text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
