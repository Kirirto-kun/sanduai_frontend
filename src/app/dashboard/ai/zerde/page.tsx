import type { Metadata } from "next";
import ZerdeWorkspace from "@/features/zerde/ZerdeWorkspace";

export const metadata: Metadata = { title: "Зерде PRO — SanduAI", description: "Оқушы зерттейді — SanduAI бағыт береді. Зерттеу идеясынан құжаттар мен қорғауға дейінгі әдістемелік кеңістік." };
export default function Page() { return <ZerdeWorkspace />; }
