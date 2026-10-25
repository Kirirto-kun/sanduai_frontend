import { Suspense } from "react";
import TrainingWorkspace from "@/features/trainings/TrainingWorkspace";

export default function Page() {
  return <Suspense fallback={<div className="h-96 rounded-3xl border border-stone-200 bg-white" role="status">Загрузка / Жүктелуде…</div>}><TrainingWorkspace /></Suspense>;
}
