import { Suspense } from "react";

import PreschoolActivityWorkspace from "@/features/preschool-activities/PreschoolActivityWorkspace";

export default function PreschoolActivitiesPage() {
  return (
    <Suspense fallback={<div className="min-h-96 animate-pulse rounded-3xl bg-white/70" />}>
      <PreschoolActivityWorkspace />
    </Suspense>
  );
}
