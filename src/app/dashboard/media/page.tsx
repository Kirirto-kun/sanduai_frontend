"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { canAccessVideoGeneration } from "@/lib/access-policy";

export default function MediaPage() {
  const { user } = useAuth();
  const { language } = useLanguage();
  return (
    <div className="glass-card rounded-3xl border border-white/60 px-6 py-6 shadow-md sm:px-8">
      <h2 className="text-lg font-semibold text-slate-900">Медиа</h2>
      <p className="mt-2 text-sm text-slate-600">
        {language === "kk"
          ? "Мәзірден фото, цифрлық аватар, ЖИ дыбыстау немесе QR-код құралын таңдаңыз."
          : "Выберите в меню создание фото, цифрового аватара, озвучку ИИ или QR-коды."}
        {canAccessVideoGeneration(user?.role) && (language === "kk" ? " Видео генерациясы да қолжетімді." : " Также доступна генерация видео.")}
      </p>
    </div>
  );
}






