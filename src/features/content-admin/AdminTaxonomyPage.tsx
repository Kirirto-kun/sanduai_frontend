"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { getLibraryCategories, getLibrarySubjects } from "@/features/content-library/api";
import { TaxonomyManager } from "./TaxonomyManager";

export function AdminTaxonomyPage() {
  const { language } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && user?.role !== "admin") router.replace("/dashboard");
  }, [authLoading, router, user]);

  const isAdmin = user?.role === "admin";
  const categoriesQuery = useQuery({
    queryKey: ["library-content-categories"],
    queryFn: ({ signal }) => getLibraryCategories(signal),
    staleTime: 10 * 60 * 1000,
    enabled: isAdmin,
  });
  const subjectsQuery = useQuery({
    queryKey: ["library-content-subjects"],
    queryFn: ({ signal }) => getLibrarySubjects(signal),
    staleTime: 10 * 60 * 1000,
    enabled: isAdmin,
  });

  if (authLoading || !isAdmin) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center" role="status">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-orange-500 border-r-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <header className="rounded-3xl border border-white/70 bg-white/95 px-5 py-6 shadow-sm sm:px-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-orange-700">SanduAI Admin</p>
            <h1 className="mt-1 text-2xl font-semibold text-slate-900 sm:text-3xl">
              {language === "kk" ? "Санаттар мен пәндер" : "Категории и предметы"}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600">
              {language === "kk"
                ? "Ортақ тізімдерді бір жерде жасаңыз және реттеңіз. Өзгерістер материал жүктеу формасы мен каталог сүзгілерінде бірден пайда болады."
                : "Создавайте и редактируйте общие списки в одном месте. Изменения сразу появятся в форме загрузки и фильтрах каталога."}
            </p>
          </div>
          <Link
            href="/dashboard/admin/library"
            className="shrink-0 rounded-xl border border-slate-200 bg-white px-4 py-3 text-center text-sm font-semibold text-slate-700 transition hover:border-orange-300 hover:text-orange-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2"
          >
            ← {language === "kk" ? "Материалдарға қайту" : "Вернуться к материалам"}
          </Link>
        </div>
      </header>

      <TaxonomyManager
        kind="subject"
        items={subjectsQuery.data ?? []}
        loading={subjectsQuery.isLoading}
        loadError={subjectsQuery.error instanceof Error ? subjectsQuery.error : null}
        onRetry={() => void subjectsQuery.refetch()}
        language={language}
      />
      <TaxonomyManager
        kind="category"
        items={categoriesQuery.data ?? []}
        loading={categoriesQuery.isLoading}
        loadError={categoriesQuery.error instanceof Error ? categoriesQuery.error : null}
        onRetry={() => void categoriesQuery.refetch()}
        language={language}
      />
    </div>
  );
}
