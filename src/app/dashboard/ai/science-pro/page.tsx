import type { Metadata } from "next";
import { Suspense } from "react";
import ScienceWorkspace from "@/features/science-pro/ScienceWorkspace";

export const metadata: Metadata = { title: "Ғылыми жоба PRO — SanduAI", description: "Идеядан — зерттеуге. 8–12-сынып оқушыларына ғылыми жобаны жоспарлау, нақты деректерді талдау және қорғауға дайындалу кеңістігі." };
export default function Page() { return <Suspense><ScienceWorkspace/></Suspense>; }
