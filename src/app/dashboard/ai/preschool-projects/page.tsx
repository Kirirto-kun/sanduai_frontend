import { Suspense } from "react";
import type { Metadata } from "next";
import ProjectWorkspace from "@/features/preschool-projects/ProjectWorkspace";

export const metadata: Metadata = {
  title: "Балабақша жобалары PRO — SanduAI",
  description: "Балабақшаға арналған ғылыми, экологиялық, STEM және дамытушы жобалар конструкторы.",
};
export default function Page() {
  return <Suspense fallback={<div className="h-96 rounded-3xl border border-stone-200 bg-white p-6" role="status">Загрузка / Жүктелуде…</div>}><ProjectWorkspace /></Suspense>;
}
