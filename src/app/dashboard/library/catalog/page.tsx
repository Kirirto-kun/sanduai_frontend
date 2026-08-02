"use client";

import { Suspense } from "react";
import { ContentLibraryPage } from "@/features/content-library/components/ContentLibraryPage";

function CatalogLoading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center" role="status" aria-label="Загрузка каталога">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-orange-500 border-r-transparent" />
    </div>
  );
}

export default function CatalogPage() {
  return (
    <Suspense fallback={<CatalogLoading />}>
      <ContentLibraryPage />
    </Suspense>
  );
}
