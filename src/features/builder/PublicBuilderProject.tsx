"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getToken } from "@/lib/api";
import { getApiBase } from "@/lib/api-base";
import { requestJson } from "@/lib/http-client";
import { useLanguage } from "@/i18n/LanguageContext";
import PreviewFrame from "./PreviewFrame";
import { builderApi } from "./api";
import type { BuilderAsset, BuilderContentLanguage } from "./types";

type PublicSnapshot = {
  id: string;
  title: string;
  description?: string;
  content_language: BuilderContentLanguage;
  files: Record<string, string>;
  version?: number;
  assets?: BuilderAsset[];
  allow_duplicate?: boolean;
};

export default function PublicBuilderProject({ shareToken }: { shareToken: string }) {
  const { language } = useLanguage();
  const router = useRouter();
  const isKk = language === "kk";
  const [snapshot, setSnapshot] = useState<PublicSnapshot | null>(null);
  const [error, setError] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [duplicateError, setDuplicateError] = useState("");

  const duplicate = async () => {
    if (!snapshot?.allow_duplicate || duplicating) return;
    if (!getToken()) {
      const returnTo = `/dashboard/ai/builder?duplicate=${encodeURIComponent(snapshot.id)}`;
      router.push(`/login?returnTo=${encodeURIComponent(returnTo)}`);
      return;
    }
    setDuplicating(true);
    setDuplicateError("");
    try {
      const project = await builderApi.duplicate(snapshot.id);
      router.push(`/dashboard/ai/builder?project=${encodeURIComponent(project.id)}`);
    } catch {
      setDuplicateError(isKk ? "Көшірме жасау мүмкін болмады." : "Не удалось создать копию.");
      setDuplicating(false);
    }
  };

  useEffect(() => {
    let active = true;
    requestJson<PublicSnapshot>(`${getApiBase()}/api/builder/public/${encodeURIComponent(shareToken)}`, {
      cache: "no-store",
    }, { timeoutMs: 30_000, notifyOnUnauthorized: false, attemptAuthRefresh: false })
      .then(value => { if (active) setSnapshot(value); })
      .catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, [shareToken]);

  if (error) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-950 p-4 text-white">
        <section className="max-w-md text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-white/10 text-2xl">◇</div>
          <h1 className="mt-5 text-2xl font-black">{isKk ? "Жоба қолжетімсіз" : "Проект недоступен"}</h1>
          <p className="mt-2 text-sm leading-6 text-slate-400">{isKk ? "Сілтеме ескірген немесе автор жобаға қолжетімділікті жапқан." : "Ссылка могла устареть, либо автор закрыл доступ к проекту."}</p>
          <Link href="/" className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-white px-5 text-sm font-black text-slate-950">{isKk ? "SanduAI-ға өту" : "Перейти в SanduAI"}</Link>
        </section>
      </main>
    );
  }

  if (!snapshot) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-950 text-white" aria-label={isKk ? "Жоба жүктелуде" : "Загрузка проекта"}>
        <div className="text-center"><div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-orange-500 border-r-transparent" /><p className="mt-4 text-sm font-bold text-slate-300">{isKk ? "Жоба ашылуда…" : "Открываем проект…"}</p></div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-[#eef1f5]">
      <header className="flex min-h-14 items-center justify-between gap-3 border-b border-slate-200 bg-white px-3 sm:px-5">
        <div className="min-w-0"><h1 className="truncate text-sm font-black text-slate-950">{snapshot.title}</h1><p className="truncate text-[10px] text-slate-400">Made with SanduAI · v{snapshot.version ?? 1}</p></div>
        <div className="flex shrink-0 items-center gap-2">
          {snapshot.allow_duplicate && (
            <button type="button" onClick={duplicate} disabled={duplicating} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 transition hover:border-orange-300 hover:text-orange-700 disabled:opacity-50">
              {duplicating ? (isKk ? "Көшірілуде…" : "Копируем…") : (isKk ? "Көшірме жасау" : "Создать копию")}
            </button>
          )}
          <Link href="/dashboard/ai/builder" className="rounded-xl bg-slate-950 px-4 py-2 text-xs font-black text-white transition hover:bg-orange-600">{isKk ? "Өз жобамды жасау" : "Создать свой проект"}</Link>
        </div>
      </header>
      {duplicateError && <p role="alert" className="border-b border-red-200 bg-red-50 px-4 py-2 text-center text-xs font-semibold text-red-700">{duplicateError}</p>}
      <div className="min-h-[560px] flex-1">
        <PreviewFrame files={snapshot.files} assets={snapshot.assets} device="desktop" language={language} refreshKey={0} onConsole={() => undefined} />
      </div>
    </main>
  );
}
