import { Suspense } from "react";
import type { Metadata } from "next";
import CoachingWorkspace from "@/features/coaching/CoachingWorkspace";

export const metadata: Metadata = { title: "Coaching Pro — SanduAI", description: "Педагогтерге арналған коучинг конструкторы: толық сценарий, практикалық тапсырмалар және дайын материалдар." };
export default function Page() {
  return <Suspense fallback={<div className="min-h-96 rounded-3xl border border-stone-200 bg-white p-8 text-sm text-slate-600" role="status">Загрузка / Жүктелуде…</div>}><CoachingWorkspace /></Suspense>;
}
