"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/i18n/LanguageContext";

export default function TjbPage() {
  const router = useRouter();
  const { language } = useLanguage();

  useEffect(() => {
    router.replace("/dashboard/ai/bjb-tjb");
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-slate-600">
          {language === "kk" ? "Бағыттау..." : "Перенаправление..."}
        </p>
      </div>
    </div>
  );
}
