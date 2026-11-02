import type { Metadata } from "next";
import { Suspense } from "react";
import ZerdeWorkspace from "@/features/zerde/ZerdeWorkspace";

export const metadata: Metadata = { title: "Зерде PRO — SanduAI", description: "Оқушы зерттейді — SanduAI бағыт береді. Зерттеу идеясынан құжаттар мен қорғауға дейінгі әдістемелік кеңістік." };
export default function Page() { return <Suspense fallback={<div role="status" className="p-8">Жүктелуде… / Загрузка…</div>}><ZerdeWorkspace /></Suspense>; }
