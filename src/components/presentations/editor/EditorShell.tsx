"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/i18n/LanguageContext";
import {
  planVersionId,
  presentationKeys,
  useCancelJob,
  useJob,
  useJobEventStream,
  useStartGeneration,
} from "@/hooks/usePresentations";
import type { JobState, PresentationProject, PresentationSlide, SlideSpec } from "@/types/presentations";
import GenerationProgress from "../GenerationOverlay";
import { getPresentationCopy } from "../copy";
import { presentationErrorMessage } from "../error-copy";
import SlidePanel from "./SlidePanel";
import SlideCanvas from "./SlideCanvas";
import SlideToolbar from "./SlideToolbar";
import ClassicEditPanel from "./AiEditPanel";
import CreativeReviewPanel from "./SlideContentRenderer";
import ExportDialog from "./ExportDialog";

function generationJobId(project: PresentationProject, explicit?: string | null) {
  if (project.latest_job && ["generate", "regenerate"].includes(project.latest_job.kind ?? "")) {
    return project.latest_job.job_id ?? project.latest_job.id;
  }
  if (explicit) return explicit;
  if (project.active_generation?.job_id) return project.active_generation.job_id;
  const value = project.generation_job_id ?? project.active_job_id;
  if (typeof value === "string") return value;
  return null;
}

function slidesForProject(project: PresentationProject): PresentationSlide[] {
  if (project.slides?.length) {
    const generationStatus = project.active_generation?.status?.toLowerCase() ?? "";
    const projectStatus = project.status.toLowerCase();
    const generationFinished =
      ["completed", "completed_with_errors", "failed", "error"].includes(generationStatus) ||
      ["ready", "review_required", "needs_review", "partial_failed", "failed"].includes(projectStatus);
    return project.slides
      .map((slide) => {
        const hasArtifact = Boolean(
          slide.artifact_url ||
          slide.asset_url ||
          slide.image_url ||
          slide.preview_url ||
          slide.versions?.length,
        );
        return generationFinished && !hasArtifact && ["planned", "approved", "queued"].includes(slide.status)
          ? { ...slide, status: "failed" }
          : slide;
      })
      .sort((a, b) => a.order - b.order);
  }
  const plan = project.approved_plan ?? project.active_plan;
  return (plan?.slides ?? []).map((slide, index) => ({
    slide_key: slide.slide_key,
    order: slide.order ?? index + 1,
    status: project.status === "generating" ? "queued" : "planned",
    title: slide.title,
    spec: {
      title: slide.title,
      body: slide.body,
      bullets: slide.bullets,
      layout: slide.layout,
      speaker_notes: slide.speaker_notes,
    },
  }));
}

export default function EditorShell({
  project,
  explicitJobId,
}: {
  project: PresentationProject;
  explicitJobId?: string | null;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { language } = useLanguage();
  const copy = getPresentationCopy(language);
  const slides = useMemo(() => slidesForProject(project), [project]);
  const [selectedKey, setSelectedKey] = useState<string | null>(
    slides.find((slide) => slide.status.toLowerCase() === "failed")?.slide_key ?? slides[0]?.slide_key ?? null,
  );
  const [drafts, setDrafts] = useState<Record<string, SlideSpec>>({});
  const [draftDirty, setDraftDirty] = useState<Record<string, boolean>>({});
  const [themeId, setThemeId] = useState(project.theme_id ?? "academic_blue");
  const [exportOpen, setExportOpen] = useState(false);
  const [recoveryError, setRecoveryError] = useState<string | null>(null);
  const derivedJobId = generationJobId(project, explicitJobId);
  const [sessionJobId, setSessionJobId] = useState<string | null>(null);
  const jobId = sessionJobId ?? derivedJobId;
  const jobQuery = useJob(jobId);
  useJobEventStream(jobId, project.id);
  useEffect(() => {
    const status = jobQuery.data?.status;
    if (["completed", "completed_with_errors", "failed", "error", "cancelled"].includes(status ?? "")) {
      void queryClient.invalidateQueries({ queryKey: presentationKeys.detail(project.id) });
    }
  }, [jobQuery.data?.status, project.id, queryClient]);
  const cancelMutation = useCancelJob();
  const retryMutation = useStartGeneration();
  const effectiveSelectedKey = slides.some((slide) => slide.slide_key === selectedKey)
    ? selectedKey
    : slides[0]?.slide_key ?? null;
  const selected = slides.find((slide) => slide.slide_key === effectiveSelectedKey) ?? null;
  const displaySlide = selected && drafts[selected.slide_key]
    ? { ...selected, spec: drafts[selected.slide_key] }
    : selected;
  const completed = slides.filter((slide) => ["ready", "accepted", "needs_review"].includes(slide.status)).length;
  const job: JobState | null = jobQuery.data ?? (project.active_generation?.status
    ? {
        id: jobId ?? project.active_generation.id ?? "generation",
        status: project.active_generation.status,
        completed: project.active_generation.completed_slides,
        total: project.active_generation.total_slides,
      }
    : null);
  const normalizedJobStatus = job?.status.toLowerCase();
  const failedJob = (normalizedJobStatus === "failed" || normalizedJobStatus === "error") && job?.kind !== "regenerate";
  const regenerationActive = job?.kind === "regenerate" && ![
    "completed",
    "completed_with_errors",
    "failed",
    "error",
    "cancelled",
  ].includes(normalizedJobStatus ?? "");
  const failedSlides = slides.filter((slide) => slide.status.toLowerCase() === "failed");
  const firstFailedSlide = failedSlides[0] ?? null;
  const allSlidesReady = slides.length > 0 && slides.every((slide) =>
    ["ready", "accepted", "needs_review", "completed"].includes(slide.status.toLowerCase()),
  );
  const projectAllowsExport = ["ready", "review_required", "needs_review", "partial_failed", "completed"].includes(
    project.status.toLowerCase(),
  );
  const canExport = projectAllowsExport && allSlidesReady && !regenerationActive;
  const exportBlockedReason = failedSlides.length > 0
    ? copy.exportBlocked
    : !allSlidesReady || regenerationActive
      ? copy.generationNotFinished
      : undefined;

  const updateDraft = useCallback((slideKey: string, spec: SlideSpec, dirty: boolean) => {
    setDrafts((current) => current[slideKey] === spec ? current : { ...current, [slideKey]: spec });
    setDraftDirty((current) => current[slideKey] === dirty ? current : { ...current, [slideKey]: dirty });
  }, []);

  const trackJob = useCallback((nextJobId: string) => {
    setRecoveryError(null);
    setSessionJobId(nextJobId);
    router.replace(
      `/dashboard/ai/presentations/editor/${project.id}?job=${encodeURIComponent(nextJobId)}`,
      { scroll: false },
    );
  }, [project.id, router]);

  const retryGeneration = async () => {
    const plan = project.approved_plan ?? project.active_plan;
    if (!plan) return;
    setRecoveryError(null);
    try {
      const next = await retryMutation.mutateAsync({ presentationId: project.id, planVersionId: planVersionId(plan) });
      trackJob(next.job_id);
    } catch (caught) {
      setRecoveryError(presentationErrorMessage(caught, copy));
    }
  };

  return (
    <div className="space-y-4">
      {job && (
        <GenerationProgress
          job={job}
          completed={completed}
          total={slides.length}
          cancelling={cancelMutation.isPending}
          onCancel={jobId ? () => cancelMutation.mutate(jobId) : undefined}
        />
      )}

      {failedSlides.length > 0 && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          <div>
            <p className="font-bold">{copy.partialFailure}</p>
            <p className="mt-1 text-amber-800">{copy.jobPartialHint}</p>
          </div>
          {firstFailedSlide && (
            <button type="button" onClick={() => setSelectedKey(firstFailedSlide.slide_key)} className="min-h-11 rounded-xl bg-amber-900 px-4 font-bold text-white hover:bg-amber-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600">
              {copy.openFailedSlide}
            </button>
          )}
        </div>
      )}

      {failedJob && failedSlides.length === 0 && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
          <div><p className="font-bold">{copy.jobFailed}</p><p className="mt-1 text-rose-800">{copy.jobFailedHint}</p></div>
          <button type="button" onClick={() => void retryGeneration()} disabled={retryMutation.isPending} className="min-h-11 rounded-xl bg-rose-700 px-4 font-bold text-white hover:bg-rose-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 disabled:opacity-50">{copy.retry}</button>
        </div>
      )}
      {recoveryError && <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{recoveryError}</div>}

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
        <SlideToolbar
          presentationId={project.id}
          title={project.title}
          mode={project.mode}
          canExport={canExport}
          exportBlockedReason={exportBlockedReason}
          onExport={() => setExportOpen(true)}
        />
        <div className="flex min-h-[36rem] flex-col lg:h-[calc(100vh-15rem)] lg:min-h-[42rem] lg:flex-row">
          <SlidePanel mode={project.mode} slides={slides} selectedKey={effectiveSelectedKey} onSelect={setSelectedKey} />
          <div className="flex min-h-[28rem] min-w-0 flex-1 flex-col lg:min-h-0 lg:flex-row">
            <SlideCanvas
              mode={project.mode}
              slide={displaySlide}
              themeId={themeId}
              preferDraftPreview={project.mode === "classic" && (
                Boolean(effectiveSelectedKey && draftDirty[effectiveSelectedKey]) || regenerationActive
              )}
            />
            {selected && project.mode === "classic" && (
              <ClassicEditPanel
                key={selected.slide_key}
                presentationId={project.id}
                slide={displaySlide ?? selected}
                themeId={themeId}
                regenerationActive={regenerationActive}
                onThemeChange={setThemeId}
                onDraftChange={(spec, dirty) => updateDraft(selected.slide_key, spec, dirty)}
                onJobStarted={trackJob}
              />
            )}
            {selected && project.mode === "creative" && (
              <CreativeReviewPanel
                presentationId={project.id}
                slide={selected}
                regenerationActive={regenerationActive}
                onJobStarted={trackJob}
              />
            )}
          </div>
        </div>
      </div>

      <ExportDialog presentationId={project.id} mode={project.mode} open={exportOpen} onClose={() => setExportOpen(false)} />
    </div>
  );
}
