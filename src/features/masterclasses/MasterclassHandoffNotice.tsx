"use client";
import Link from "next/link";
import { useLanguage } from "@/i18n/LanguageContext";
import type { MasterclassHandoffState } from "./useMasterclassHandoff";

export function MasterclassHandoffNotice({ handoff, onClear }: { handoff: MasterclassHandoffState; onClear?: () => void }) {
  const { language } = useLanguage();
  const kk = language === "kk";
  if (!handoff.requested) return null;
  return <aside className="mb-5 rounded-2xl border border-teal-200 bg-teal-50 p-4 text-sm text-teal-950" aria-live="polite">
    <p className="font-bold">{kk ? "Шебер сынып материалы" : "Материал мастер-класса"}</p>
    <p className="mt-1 text-sm leading-6">{handoff.blocked ? (kk ? "Ашық жұмыс жалғасуда. Жаңа материалды бөлек редакторда ашыңыз." : "Открытая работа продолжается. Новый материал можно открыть в отдельном редакторе.") : handoff.loading ? (kk ? "Толық материал жүктелуде…" : "Загружаем полный материал…") : handoff.payload ? handoff.payload.title : null}</p>
    {handoff.error && <p role="alert" className="mt-2 text-rose-700">{handoff.error}</p>}
    <div className="mt-3 flex flex-wrap items-center gap-4">
      {handoff.sourceId && <Link href={`/dashboard/ai/masterclasses?work=${encodeURIComponent(handoff.sourceId)}`} className="font-semibold underline underline-offset-4">{kk ? "Бастапқы материал" : "Исходный материал"}</Link>}
      <button type="button" onClick={() => { onClear?.(); handoff.clear(); }} className="min-h-10 rounded-xl border border-teal-300 bg-white px-3 font-semibold">{kk ? "Бос сұраудан бастау" : "Начать с пустого запроса"}</button>
    </div>
  </aside>;
}
