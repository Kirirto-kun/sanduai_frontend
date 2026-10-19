import { Suspense } from "react";
import MasterclassWorkspace from "@/features/masterclasses/MasterclassWorkspace";
export default function Page() { return <Suspense fallback={<div className="h-96 animate-pulse rounded-3xl bg-white" />}><MasterclassWorkspace /></Suspense>; }
