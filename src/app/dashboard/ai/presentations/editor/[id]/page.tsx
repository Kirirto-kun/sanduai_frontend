"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePresentation } from "@/hooks/usePresentations";
import EditorShell from "@/components/presentations/editor/EditorShell";
import LegacyPresentationView from "@/components/presentations/LegacyPresentationView";
import { isLegacyReadOnly } from "@/components/presentations/legacy-utils";
import { ErrorNotice, PresentationStepper } from "@/components/presentations/PresentationUI";
import { getPresentationCopy } from "@/components/presentations/copy";

export default function PresentationEditorPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language } = useLanguage();
  const copy = getPresentationCopy(language);
  const projectQuery = usePresentation(params.id);

  useEffect(() => {
    const canonicalId = projectQuery.data?.id;
    if (canonicalId && canonicalId !== params.id) {
      router.replace(`/dashboard/ai/presentations/editor/${canonicalId}`);
    }
  }, [params.id, projectQuery.data?.id, router]);

  if (projectQuery.isLoading) {
    return (
      <div className="mx-auto max-w-7xl space-y-4" aria-busy="true">
        <div className="h-12 animate-pulse rounded-2xl bg-white/70" />
        <div className="h-[36rem] animate-pulse rounded-3xl bg-white/70" />
      </div>
    );
  }
  if (projectQuery.isError || !projectQuery.data) {
    return <div className="mx-auto max-w-4xl"><ErrorNotice message={copy.genericError} onRetry={() => projectQuery.refetch()} /></div>;
  }

  const project = projectQuery.data;
  if (isLegacyReadOnly(project)) {
    return (
      <div className="mx-auto max-w-6xl space-y-5 pb-8">
        <Link href="/dashboard/ai/presentations" className="inline-flex min-h-11 items-center rounded-xl px-2 text-sm font-semibold text-slate-600 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"><span className="mr-2" aria-hidden="true">←</span>{copy.backToPresentations}</Link>
        <LegacyPresentationView project={project} />
      </div>
    );
  }
  const reviewStage = ["review_required", "needs_review", "ready", "partial_failed"].includes(project.status);
  return (
    <div className="mx-auto max-w-[100rem] space-y-5 pb-8">
      <Link href="/dashboard/ai/presentations" className="inline-flex min-h-11 items-center rounded-xl px-2 text-sm font-semibold text-slate-600 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"><span className="mr-2" aria-hidden="true">←</span>{copy.backToPresentations}</Link>
      <PresentationStepper current={reviewStage ? 4 : 3} />
      <EditorShell project={project} explicitJobId={searchParams.get("job")} />
    </div>
  );
}
