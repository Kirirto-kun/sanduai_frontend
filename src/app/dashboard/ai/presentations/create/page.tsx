"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useLanguage } from "@/i18n/LanguageContext";
import { useCreatePresentation, useStartPlanJob } from "@/hooks/usePresentations";
import type { CreatePresentationInput, PresentationMode } from "@/types/presentations";
import CreateForm from "@/components/presentations/CreateForm";
import { ErrorNotice, PresentationStepper } from "@/components/presentations/PresentationUI";
import { getPresentationCopy } from "@/components/presentations/copy";
import { presentationErrorMessage } from "@/components/presentations/error-copy";

export default function CreatePresentationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language } = useLanguage();
  const copy = getPresentationCopy(language);
  const simpleSubtitle = language === "kk"
    ? "Тақырыпты, пәнді және сыныпты көрсетіңіз — қалғанын ЖИ өзі дайындайды."
    : "Укажите тему, предмет и класс — всё остальное подготовит ИИ.";
  const requestedMode = searchParams.get("mode");
  const mode: PresentationMode = requestedMode === "creative" ? "creative" : "classic";
  const createMutation = useCreatePresentation();
  const planMutation = useStartPlanJob();
  const [error, setError] = useState<string | null>(null);
  const loading = createMutation.isPending || planMutation.isPending;

  const handleSubmit = async (input: CreatePresentationInput) => {
    setError(null);
    try {
      const project = await createMutation.mutateAsync(input);
      try {
        const job = await planMutation.mutateAsync({ id: project.id });
        const jobQuery = job.job_id ? `?job=${encodeURIComponent(job.job_id)}` : "";
        router.push(`/dashboard/ai/presentations/outline/${project.id}${jobQuery}`);
      } catch {
        // The project is already safe in the library. The outline page resumes
        // plan creation automatically instead of making the teacher submit again.
        router.push(`/dashboard/ai/presentations/outline/${project.id}`);
      }
    } catch (caught) {
      setError(presentationErrorMessage(caught, copy));
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-8">
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/dashboard/ai/presentations"
          className="inline-flex min-h-11 items-center rounded-xl px-2 text-sm font-semibold text-slate-600 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
        >
          <span className="mr-2" aria-hidden="true">←</span>
          {copy.backToPresentations}
        </Link>
      </div>

      <PresentationStepper current={1} />

      <header className="rounded-[2rem] border border-white/80 bg-white/85 px-6 py-7 shadow-sm backdrop-blur sm:px-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">{copy.setupTitle}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{simpleSubtitle}</p>
      </header>

      {error && <ErrorNotice message={error} />}

      <div className="rounded-[2rem] border border-white/80 bg-white/90 p-5 shadow-sm backdrop-blur sm:p-8">
        <CreateForm mode={mode} loading={loading} onSubmit={handleSubmit} />
      </div>
    </div>
  );
}
