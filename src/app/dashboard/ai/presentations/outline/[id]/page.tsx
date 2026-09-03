"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useLanguage } from "@/i18n/LanguageContext";
import {
  planVersionId,
  useApprovePlan,
  useCostEstimate,
  useJob,
  useJobEventStream,
  usePresentation,
  useStartGeneration,
  useStartPlanJob,
  useUpdatePlan,
} from "@/hooks/usePresentations";
import type { JobState, PlanSlide, PresentationPlan, PresentationProject, UpdatePlanInput } from "@/types/presentations";
import LegacyPresentationView from "@/components/presentations/LegacyPresentationView";
import OutlineList from "@/components/presentations/OutlineList";
import { ConfirmDialog, ErrorNotice, ModeBadge, PresentationStepper } from "@/components/presentations/PresentationUI";
import { getPresentationCopy } from "@/components/presentations/copy";
import { teacherVisibleCoinCost } from "@/components/presentations/creation-policy";
import { presentationErrorMessage } from "@/components/presentations/error-copy";
import { isLegacyReadOnly } from "@/components/presentations/legacy-utils";
import { generationServerStatusCopy } from "@/lib/generation-history";

function getPlanJobId(project: PresentationProject | undefined, queryValue: string | null) {
  if (queryValue) return queryValue;
  if (project?.active_plan_job_id) return project.active_plan_job_id;
  const candidate = project?.plan_job_id ?? project?.active_plan_job;
  if (typeof candidate === "string") return candidate;
  if (candidate && typeof candidate === "object" && "job_id" in candidate) {
    return String(candidate.job_id);
  }
  if (project?.latest_job?.kind === "plan") {
    return project.latest_job.job_id ?? project.latest_job.id;
  }
  return null;
}

function isExactPlanJob(
  job: JobState | null | undefined,
  expectedJobId: string | null,
  expectedProjectId: string,
): boolean {
  if (!job || !expectedJobId) return false;
  const actualJobId = job.id || job.job_id;
  return actualJobId === expectedJobId &&
    job.kind === "plan" &&
    (!job.project_id || job.project_id === expectedProjectId);
}

function planSlideForApi(slide: PlanSlide, index: number, mode: PresentationProject["mode"]): PlanSlide {
  const base = { ...slide, order: index + 1, order_index: index };
  if (mode !== "classic") return base;

  const roleAliases: Record<string, string> = {
    auto: "content",
    title_body: "content",
    two_columns: "comparison",
    cards: "content",
  };
  let role = roleAliases[slide.role ?? slide.layout ?? "content"] ?? (slide.role ?? slide.layout ?? "content");
  const existingBody = typeof slide.content?.body === "string" ? slide.content.body.trim() : "";
  const existingBullets = Array.isArray(slide.content?.bullets)
    ? slide.content.bullets.map((item) => String(item).trim()).filter(Boolean)
    : [];
  const hasSimpleEdits = slide.body !== undefined || slide.bullets !== undefined;
  const bullets = (slide.bullets ?? existingBullets).map((item) => item.trim()).filter(Boolean);
  const body = slide.body !== undefined ? slide.body.trim() : existingBody;
  const content: Record<string, unknown> = {
    ...(slide.content ?? {}),
    body,
    bullets,
    subtitle: slide.content?.subtitle ?? slide.purpose ?? "",
  };

  if (role === "comparison" && (hasSimpleEdits || !Array.isArray(content.columns))) {
    if (bullets.length >= 2) {
      const midpoint = Math.ceil(bullets.length / 2);
      content.columns = [
        { title: "A", items: bullets.slice(0, midpoint) },
        { title: "B", items: bullets.slice(midpoint) },
      ];
    } else {
      role = "content";
      delete content.columns;
    }
  } else if ((role === "timeline" || role === "process") && (hasSimpleEdits || !Array.isArray(content.steps))) {
    if (bullets.length >= 2) {
      content.steps = bullets.slice(0, 6).map((text, stepIndex) => ({ label: String(stepIndex + 1), text }));
    } else {
      role = "content";
      delete content.steps;
    }
  } else if (role === "diagram" && (hasSimpleEdits || !Array.isArray(content.nodes))) {
    if (bullets.length >= 2) {
      content.nodes = bullets.slice(0, 8).map((label, nodeIndex) => ({ id: `node-${nodeIndex + 1}`, label }));
      content.edges = bullets.slice(1, 8).map((_, edgeIndex) => ({ from: `node-${edgeIndex + 1}`, to: `node-${edgeIndex + 2}` }));
    } else {
      role = "content";
      delete content.nodes;
      delete content.edges;
    }
  } else if (role === "table" && (hasSimpleEdits || (!content.table && !Array.isArray(content.headers)))) {
    const rows = (bullets.length ? bullets : [body]).filter(Boolean).slice(0, 8).map((item) => [item]);
    if (rows.length) content.table = { headers: [slide.title], rows };
    else {
      role = "content";
      delete content.table;
    }
  } else if (role === "quiz" && (hasSimpleEdits || !Array.isArray(content.options))) {
    if (bullets.length >= 2) {
      content.question = body || slide.title;
      content.options = bullets.slice(0, 6);
    } else {
      role = "content";
      delete content.question;
      delete content.options;
    }
  } else if (role === "summary") {
    content.items = bullets.slice(0, 6);
    content.closing = body;
  }

  return { ...base, role, layout: undefined, content };
}

function PlanEditor({ project, initialPlan }: { project: PresentationProject; initialPlan: PresentationPlan }) {
  const router = useRouter();
  const { language } = useLanguage();
  const copy = getPresentationCopy(language);
  const updateMutation = useUpdatePlan();
  const approveMutation = useApprovePlan();
  const generationMutation = useStartGeneration();
  const costMutation = useCostEstimate();
  const [title, setTitle] = useState(initialPlan.title || project.title);
  const [slides, setSlides] = useState(initialPlan.slides);
  const [revision, setRevision] = useState(initialPlan.revision);
  const [baseline, setBaseline] = useState(() => JSON.stringify({ title: initialPlan.title || project.title, slides: initialPlan.slides }));
  const [error, setError] = useState<string | null>(null);
  const [approveOpen, setApproveOpen] = useState(false);
  const approvedReadOnly = initialPlan.status === "approved";
  const currentSnapshot = useMemo(() => JSON.stringify({ title, slides }), [slides, title]);
  const dirty = currentSnapshot !== baseline;
  const invalidPlan = useMemo(
    () =>
      slides.length < 4 ||
      slides.length > 30 ||
      slides.some(
        (slide) =>
          !slide.title.trim() ||
          (slide.bullets?.length ?? 0) > 16 ||
          (slide.facts?.length ?? 0) > 20 ||
          (slide.exact_text?.length ?? 0) > 20,
      ),
    [slides],
  );
  const busy = updateMutation.isPending || approveMutation.isPending || generationMutation.isPending;

  useEffect(() => {
    costMutation.mutate({ presentationId: project.id, planVersionId: planVersionId(initialPlan) });
    // The estimate is refreshed explicitly after every save.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPlan.id, project.id]);

  const payload = (): UpdatePlanInput => {
    return {
      revision,
      title: title.trim() || project.title,
      style_anchor: initialPlan.style_anchor,
      slides: slides.map((slide, index) => planSlideForApi(slide, index, project.mode)),
    };
  };

  const save = async () => {
    if (invalidPlan) {
      setError(copy.planValidation);
      throw new Error(copy.planValidation);
    }
    if (!dirty) return initialPlan;
    setError(null);
    try {
      const updated = await updateMutation.mutateAsync({
        presentationId: project.id,
        planId: initialPlan.id,
        input: payload(),
      });
      setRevision(updated.revision);
      const nextTitle = updated.title || title;
      const nextSlides = updated.slides?.length ? updated.slides : slides;
      setTitle(nextTitle);
      setSlides(nextSlides);
      setBaseline(JSON.stringify({ title: nextTitle, slides: nextSlides }));
      costMutation.mutate({ presentationId: project.id, planVersionId: planVersionId(updated) });
      return updated;
    } catch (caught) {
      setError(presentationErrorMessage(caught, copy));
      throw caught;
    }
  };

  const showApproval = async () => {
    try {
      const saved = await save();
      const id = planVersionId(saved ?? initialPlan);
      if (!costMutation.data || dirty) {
        await costMutation.mutateAsync({ presentationId: project.id, planVersionId: id });
      }
      setApproveOpen(true);
    } catch (caught) {
      if (!error) {
        setError(presentationErrorMessage(caught, copy));
      }
    }
  };

  const approveAndGenerate = async () => {
    setError(null);
    try {
      const approved = await approveMutation.mutateAsync({
        presentationId: project.id,
        planId: initialPlan.id,
        revision,
      });
      const job = await generationMutation.mutateAsync({
        presentationId: project.id,
        planVersionId: planVersionId(approved),
      });
      router.push(`/dashboard/ai/presentations/editor/${project.id}?job=${encodeURIComponent(job.job_id)}`);
    } catch (caught) {
      setApproveOpen(false);
      setError(presentationErrorMessage(caught, copy));
    }
  };

  const total = teacherVisibleCoinCost(costMutation.data);
  const currencyLabel = copy.coins;

  return (
    <>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 space-y-5">
          <section className="rounded-3xl border border-white/80 bg-white/90 p-5 shadow-sm sm:p-6">
            <label htmlFor="plan-presentation-title" className="text-sm font-bold text-slate-800">{copy.presentationTitle}</label>
            <input id="plan-presentation-title" disabled={approvedReadOnly} value={title} onChange={(event) => setTitle(event.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-slate-200 px-3.5 text-base text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-300/70 disabled:bg-slate-50" />
          </section>

          <OutlineList mode={project.mode} slides={slides} onChange={setSlides} disabled={busy || approvedReadOnly} />
          {invalidPlan && <ErrorNotice message={copy.planValidation} />}
          {error && <ErrorNotice message={error} />}
        </div>

        <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
          <div className="rounded-3xl border border-slate-200 bg-white/95 p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-bold text-slate-900">{copy.costTitle}</p>
              <ModeBadge mode={project.mode} />
            </div>
            {costMutation.isPending ? (
              <div className="mt-4 h-16 animate-pulse rounded-xl bg-slate-100" aria-live="polite"> </div>
            ) : costMutation.data ? (
              <dl className="mt-4">
                {total != null && <div className="flex items-center justify-between gap-3"><dt className="font-semibold text-slate-600">{copy.costTotal}</dt><dd className="text-xl font-bold text-slate-950">{total.toFixed(2)} {currencyLabel}</dd></div>}
              </dl>
            ) : (
              <button type="button" onClick={() => costMutation.mutate({ presentationId: project.id, planVersionId: planVersionId(initialPlan) })} className="mt-4 min-h-11 w-full rounded-xl border border-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400">{copy.calculateCost}</button>
            )}
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white/95 p-5 shadow-sm">
            {approvedReadOnly ? (
              <>
                <p className="text-sm leading-6 text-slate-600">{copy.approvedPlanReadOnly}</p>
                <Link href={`/dashboard/ai/presentations/editor/${project.id}`} className="mt-4 flex min-h-12 items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-bold text-white hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500">{copy.backToEditor}</Link>
              </>
            ) : (
              <>
                <p aria-live="polite" className={`text-sm font-semibold ${dirty ? "text-amber-700" : "text-emerald-700"}`}>
                  {updateMutation.isPending ? copy.saving : dirty ? copy.unsaved : copy.saved}
                </p>
                <button type="button" onClick={() => void save().catch(() => undefined)} disabled={!dirty || busy || invalidPlan} className="mt-4 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:opacity-40">{copy.saveDraft}</button>
                <button type="button" onClick={() => void showApproval()} disabled={busy || invalidPlan} className={`mt-2 min-h-14 w-full rounded-2xl px-4 text-sm font-bold text-white shadow-md transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 ${project.mode === "creative" ? "bg-violet-600 hover:bg-violet-700 focus-visible:ring-violet-500" : "bg-slate-900 hover:bg-slate-800 focus-visible:ring-slate-500"}`}>{copy.approveAndGenerate}</button>
              </>
            )}
          </div>
        </aside>
      </div>

      <ConfirmDialog
        open={approveOpen}
        title={copy.approveTitle}
        body={project.mode === "creative" ? copy.approveCreativeBody : copy.approveClassicBody}
        confirmLabel={copy.approve}
        cancelLabel={copy.cancel}
        busy={approveMutation.isPending || generationMutation.isPending}
        onConfirm={() => void approveAndGenerate()}
        onClose={() => !busy && setApproveOpen(false)}
      >
        {total != null && (
          <div className="mt-5 flex items-center justify-between rounded-2xl bg-slate-50 p-4">
            <span className="text-sm font-semibold text-slate-600">{copy.costTotal}</span>
            <span className="text-xl font-bold text-slate-950">{total.toFixed(2)} {currencyLabel}</span>
          </div>
        )}
      </ConfirmDialog>
    </>
  );
}

export default function OutlinePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language } = useLanguage();
  const copy = getPresentationCopy(language);
  const projectId = params.id;
  const projectQuery = usePresentation(projectId);
  const planJobId = getPlanJobId(projectQuery.data, searchParams.get("job"));
  const jobQuery = useJob(planJobId);
  const planJobAcknowledged = isExactPlanJob(jobQuery.data, planJobId, projectId);
  useJobEventStream(planJobAcknowledged ? planJobId : null, projectId);
  const startPlanMutation = useStartPlanJob();
  const autoRetryAttempted = useRef(false);

  useEffect(() => {
    const status = jobQuery.data?.status?.toLowerCase();
    if (planJobAcknowledged && (status === "completed" || status === "completed_with_errors")) {
      void projectQuery.refetch();
    }
    // Refetching here is the polling fallback when SSE is unavailable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobQuery.data?.status, planJobAcknowledged]);

  useEffect(() => {
    const project = projectQuery.data;
    if (project && isLegacyReadOnly(project)) {
      router.replace(`/dashboard/ai/presentations/editor/${project.id}`);
    }
  }, [projectQuery.data, router]);

  useEffect(() => {
    const project = projectQuery.data;
    const status = jobQuery.data?.status?.toLowerCase();
    const recoverFailedJob = planJobAcknowledged && (status === "failed" || status === "error");
    const resumeMissingJob = Boolean(
      project &&
      !planJobId &&
      ["draft", "planning"].includes(project.status.toLowerCase()),
    );
    if (
      project &&
      !isLegacyReadOnly(project) &&
      !project.active_plan &&
      (recoverFailedJob || resumeMissingJob) &&
      !autoRetryAttempted.current
    ) {
      autoRetryAttempted.current = true;
      void startPlanMutation
        .mutateAsync({ id: projectId, input: { regenerate: recoverFailedJob } })
        .then((job) => {
          router.replace(`/dashboard/ai/presentations/outline/${projectId}?job=${encodeURIComponent(job.job_id)}`);
        })
        .catch(() => undefined);
    }
    // One automatic recovery attempt per page visit; a visible manual retry remains afterwards.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobQuery.data?.status, planJobAcknowledged, projectQuery.data?.active_plan, projectId, router]);

  const restartPlan = async (regenerate = true) => {
    startPlanMutation.reset();
    const job = await startPlanMutation.mutateAsync({ id: projectId, input: { regenerate } });
    router.replace(`/dashboard/ai/presentations/outline/${projectId}?job=${encodeURIComponent(job.job_id)}`);
  };

  const refreshPlanStatus = async () => {
    await projectQuery.refetch();
    router.replace(`/dashboard/ai/presentations/outline/${projectId}`);
  };

  if (projectQuery.isLoading) {
    return <div className="mx-auto max-w-6xl space-y-4" aria-busy="true"><div className="h-12 animate-pulse rounded-2xl bg-white/70" /><div className="h-72 animate-pulse rounded-3xl bg-white/70" /></div>;
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
  const plan = project.active_plan;
  const planJobStatus = jobQuery.data?.status?.toLowerCase();
  const jobFailed = planJobAcknowledged && (
    planJobStatus === "failed" || planJobStatus === "error" || planJobStatus === "cancelled"
  );
  const jobStatusUnavailable = Boolean(
    planJobId && (jobQuery.isError || (jobQuery.data && !planJobAcknowledged)),
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-8">
      <Link href="/dashboard/ai/presentations" className="inline-flex min-h-11 items-center rounded-xl px-2 text-sm font-semibold text-slate-600 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"><span className="mr-2" aria-hidden="true">←</span>{copy.backToPresentations}</Link>
      <PresentationStepper current={2} />
      <header className="rounded-[2rem] border border-white/80 bg-white/90 px-6 py-7 shadow-sm sm:px-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">{copy.planTitle}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{copy.planSubtitle}</p>
          </div>
          <ModeBadge mode={project.mode} />
        </div>
      </header>

      {!plan && !planJobId ? (
        <section className="rounded-[2rem] border border-amber-200 bg-amber-50 px-6 py-12 text-center shadow-sm">
          <h2 className="text-xl font-bold text-amber-950">{copy.planNotStarted}</h2>
          {startPlanMutation.isPending && <p role="status" className="mx-auto mt-3 max-w-xl text-sm leading-6 text-amber-900">{copy.planAutoRetrying}</p>}
          {startPlanMutation.isError && <p role="status" className="mx-auto mt-3 max-w-xl text-sm leading-6 text-amber-900">{copy.planRetryUnavailable}</p>}
          <button type="button" onClick={() => void restartPlan(false).catch(() => undefined)} disabled={startPlanMutation.isPending} className="mt-4 min-h-12 rounded-xl bg-slate-900 px-5 text-sm font-bold text-white hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 disabled:opacity-50">{startPlanMutation.isPending ? copy.creatingPlan : copy.startPlan}</button>
        </section>
      ) : !plan && jobStatusUnavailable ? (
        <section aria-live="polite" className="rounded-[2rem] border border-amber-200 bg-amber-50 px-6 py-12 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-xl shadow-sm" aria-hidden="true">↻</div>
          <h2 className="mt-4 text-xl font-bold text-amber-950">{copy.planStatusUnavailable}</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-amber-900">{copy.planStatusHint}</p>
          <button type="button" onClick={() => void refreshPlanStatus()} disabled={projectQuery.isFetching} className="mt-5 min-h-12 rounded-xl bg-slate-900 px-5 text-sm font-bold text-white hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 disabled:opacity-50">{projectQuery.isFetching ? copy.loading : copy.checkPlanStatus}</button>
        </section>
      ) : !plan && !jobFailed ? (
        <section aria-live="polite" className="rounded-[2rem] border border-white/80 bg-white/90 px-6 py-16 text-center shadow-sm">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" />
          <h2 className="mt-5 text-xl font-bold text-slate-900">{copy.planGenerating}</h2>
          <p className="mt-2 text-sm text-slate-500">
            {generationServerStatusCopy(language, planJobAcknowledged)}
          </p>
        </section>
      ) : jobFailed && !plan ? (
        <section aria-live="polite" className="rounded-[2rem] border border-amber-200 bg-amber-50 px-6 py-12 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-xl shadow-sm" aria-hidden="true">↻</div>
          <h2 className="mt-4 text-xl font-bold text-amber-950">{startPlanMutation.isPending ? copy.planGenerating : copy.planFailed}</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-amber-900">{startPlanMutation.isPending ? copy.planAutoRetrying : startPlanMutation.isError ? copy.planRetryUnavailable : copy.planFailureHint}</p>
          <button type="button" onClick={() => void restartPlan().catch(() => undefined)} disabled={startPlanMutation.isPending} className="mt-5 min-h-12 rounded-xl bg-slate-900 px-5 text-sm font-bold text-white hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 disabled:opacity-50">{startPlanMutation.isPending ? copy.planRetrying : copy.regeneratePlan}</button>
        </section>
      ) : plan ? (
        <PlanEditor key={plan.id} project={project} initialPlan={plan} />
      ) : null}
    </div>
  );
}
