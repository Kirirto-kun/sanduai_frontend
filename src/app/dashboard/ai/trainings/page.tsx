import { Suspense } from "react";
import type { Metadata } from "next";
import TrainingWorkspace from "@/features/trainings/TrainingWorkspace";

export const metadata: Metadata = {
  title: "Тренинги и семинары — SanduAI",
  description: "Сценарии тренингов, семинаров и командных встреч с готовыми заданиями и материалами.",
};

export default function Page() {
  return <Suspense fallback={<div className="h-96 rounded-3xl border border-stone-200 bg-white" role="status">Загрузка / Жүктелуде…</div>}><TrainingWorkspace /></Suspense>;
}
