import { Suspense } from "react";
import type { Metadata } from "next";
import MeetingWorkspace from "@/features/parent-meetings/MeetingWorkspace";

export const metadata: Metadata = { title: "Parent Meeting Pro — SanduAI", description: "Мектеп пен балабақшаға арналған ата-аналар жиналысы: толық сценарий, нақты уақыт және дайын материалдар." };

export default function Page() {
  return <Suspense fallback={<div className="min-h-96 rounded-3xl border border-stone-200 bg-white p-8 text-sm text-slate-600" role="status">Загрузка / Жүктелуде…</div>}><MeetingWorkspace /></Suspense>;
}
