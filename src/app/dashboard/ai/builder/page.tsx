import { Suspense } from "react";

import BuilderWorkspace from "@/features/builder/BuilderWorkspace";

function BuilderFallback() {
  return (
    <div
      className="-mx-2 -mt-4 flex h-[calc(100vh-4.6rem)] min-h-[650px] flex-col overflow-hidden bg-[#f6f7f9] sm:-mx-4 md:-mx-6 lg:-mx-8"
      role="status"
      aria-label="Vibe Coding загружается"
    >
      <div className="h-14 shrink-0 animate-pulse border-b border-slate-200 bg-white" />
      <div className="grid min-h-0 flex-1 lg:grid-cols-[310px_minmax(420px,1fr)_330px]">
        <div className="hidden animate-pulse border-r border-slate-200 bg-white lg:block" />
        <div className="m-4 animate-pulse rounded-3xl bg-slate-200/70" />
        <div className="hidden animate-pulse border-l border-slate-200 bg-white lg:block" />
      </div>
      <span className="sr-only">Загружаем проекты и восстанавливаем активную генерацию…</span>
    </div>
  );
}

export default function BuilderPage() {
  return (
    <Suspense fallback={<BuilderFallback />}>
      <BuilderWorkspace />
    </Suspense>
  );
}
