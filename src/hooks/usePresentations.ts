"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "@/lib/presentations-api";
import type {
  CreateExportInput,
  CreatePresentationInput,
  JobRef,
  JobState,
  PlanJobInput,
  PresentationPlan,
  PresentationProject,
  SlideSpec,
  UpdatePlanInput,
} from "@/types/presentations";

export const presentationKeys = {
  all: ["presentations-v2"] as const,
  list: () => [...presentationKeys.all, "list"] as const,
  detail: (id: string) => [...presentationKeys.all, "detail", id] as const,
  job: (id: string) => [...presentationKeys.all, "job", id] as const,
  exports: (id: string) => [...presentationKeys.all, "exports", id] as const,
  kmzhSources: () => [...presentationKeys.all, "kmzh-sources"] as const,
};

const terminalJobStatuses = new Set([
  "completed",
  "completed_with_errors",
  "failed",
  "error",
  "cancelled",
]);

export function usePresentationsList() {
  return useQuery({
    queryKey: presentationKeys.list(),
    queryFn: ({ signal }) => api.listPresentations(signal),
  });
}

export function usePresentation(id: string | null | undefined) {
  return useQuery({
    queryKey: presentationKeys.detail(id ?? ""),
    queryFn: ({ signal }) => api.getPresentation(id!, signal),
    enabled: Boolean(id),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "planning" || status === "queued" || status === "generating"
        ? 2500
        : false;
    },
  });
}

export function useJob(jobId: string | null | undefined) {
  return useQuery({
    queryKey: presentationKeys.job(jobId ?? ""),
    queryFn: ({ signal }) => api.getJob(jobId!, signal),
    enabled: Boolean(jobId),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status && terminalJobStatuses.has(status) ? false : 2000;
    },
  });
}

export function usePresentationExports(presentationId: string | null | undefined) {
  return useQuery({
    queryKey: presentationKeys.exports(presentationId ?? ""),
    queryFn: ({ signal }) => api.listExports(presentationId!, signal),
    enabled: Boolean(presentationId),
    refetchInterval: (query) =>
      query.state.data?.some((item) =>
        item.status === "queued" || item.status === "running" || item.status === "processing",
      )
        ? 2500
        : false,
  });
}

function useInvalidatePresentation() {
  const queryClient = useQueryClient();
  return async (id: string) => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: presentationKeys.detail(id) }),
      queryClient.invalidateQueries({ queryKey: presentationKeys.list() }),
    ]);
  };
}

export function useCreatePresentation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePresentationInput) => api.createPresentation(input),
    onSuccess: (project) => {
      queryClient.setQueryData(presentationKeys.detail(project.id), project);
      queryClient.invalidateQueries({ queryKey: presentationKeys.list() });
    },
  });
}

export function useSavedKmzhSources(enabled = true) {
  return useQuery({
    queryKey: presentationKeys.kmzhSources(),
    queryFn: ({ signal }) => api.listSavedKmzhSources(signal),
    enabled,
    staleTime: 30_000,
  });
}

export function useUpdatePresentation() {
  const invalidate = useInvalidatePresentation();
  return useMutation({
    mutationFn: ({
      id,
      patch,
    }: {
      id: string;
      patch: Partial<PresentationProject> & Record<string, unknown>;
    }) => api.updatePresentation(id, patch),
    onSuccess: (project) => invalidate(project.id),
  });
}

export function useDeletePresentation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deletePresentation(id),
    onSuccess: (_result, id) => {
      queryClient.removeQueries({ queryKey: presentationKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: presentationKeys.list() });
    },
  });
}

export function useStartPlanJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input?: PlanJobInput }) =>
      api.startPlanJob(id, input),
    onSuccess: (job, variables) => {
      queryClient.setQueryData<JobState>(presentationKeys.job(job.job_id), {
        id: job.job_id,
        job_id: job.job_id,
        kind: "plan",
        status: "queued",
      });
      queryClient.invalidateQueries({ queryKey: presentationKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: presentationKeys.list() });
    },
  });
}

export function useUpdatePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      presentationId,
      planId,
      input,
    }: {
      presentationId: string;
      planId: string;
      input: UpdatePlanInput;
    }) => api.updatePlan(presentationId, planId, input),
    onSuccess: (plan, variables) => {
      queryClient.setQueryData<PresentationProject>(
        presentationKeys.detail(variables.presentationId),
        (current) => (current ? { ...current, title: plan.title, active_plan: plan } : current),
      );
    },
  });
}

export function useApprovePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      presentationId,
      planId,
      revision,
    }: {
      presentationId: string;
      planId: string;
      revision: number;
    }) => api.approvePlan(presentationId, planId, revision),
    onSuccess: (plan, variables) => {
      queryClient.setQueryData<PresentationProject>(
        presentationKeys.detail(variables.presentationId),
        (current) =>
          current
            ? { ...current, status: "approved", active_plan: plan, approved_plan: plan }
            : current,
      );
      queryClient.invalidateQueries({ queryKey: presentationKeys.list() });
    },
  });
}

export function useCostEstimate() {
  return useMutation({
    mutationFn: ({ presentationId, planVersionId }: { presentationId: string; planVersionId: string }) =>
      api.estimateCost(presentationId, planVersionId),
  });
}

export function useStartGeneration() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ presentationId, planVersionId }: { presentationId: string; planVersionId: string }) =>
      api.startGeneration(presentationId, planVersionId),
    onSuccess: (job, variables) => {
      queryClient.setQueryData<JobState>(presentationKeys.job(job.job_id), {
        id: job.job_id,
        job_id: job.job_id,
        kind: "generate",
        status: "queued",
      });
      queryClient.invalidateQueries({ queryKey: presentationKeys.detail(variables.presentationId) });
      queryClient.invalidateQueries({ queryKey: presentationKeys.list() });
    },
  });
}

export function useCancelJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (jobId: string) => api.cancelJob(jobId),
    onSuccess: (job) => {
      queryClient.setQueryData(presentationKeys.job(job.id ?? job.job_id ?? ""), job);
      queryClient.invalidateQueries({ queryKey: presentationKeys.all });
    },
  });
}

export function useUpdateSlide() {
  const queryClient = useQueryClient();
  const invalidate = useInvalidatePresentation();
  return useMutation({
    mutationFn: ({
      presentationId,
      slideKey,
      spec,
    }: {
      presentationId: string;
      slideKey: string;
      spec: SlideSpec;
    }) => api.updateSlide(presentationId, slideKey, spec),
    onSuccess: (job, variables) => {
      queryClient.setQueryData<JobState>(presentationKeys.job(job.job_id), {
        id: job.job_id,
        job_id: job.job_id,
        kind: "regenerate",
        status: "queued",
      });
      return invalidate(variables.presentationId);
    },
  });
}

export function useRegenerateSlide() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      presentationId,
      slideKey,
      instruction,
    }: {
      presentationId: string;
      slideKey: string;
      instruction?: string;
    }) => api.regenerateSlide(presentationId, slideKey, instruction),
    onSuccess: (job, variables) => {
      queryClient.setQueryData<JobState>(presentationKeys.job(job.job_id), {
        id: job.job_id,
        job_id: job.job_id,
        kind: "regenerate",
        status: "queued",
      });
      queryClient.invalidateQueries({ queryKey: presentationKeys.detail(variables.presentationId) });
    },
  });
}

export function useActivateSlideVersion() {
  const invalidate = useInvalidatePresentation();
  return useMutation({
    mutationFn: ({
      presentationId,
      slideKey,
      versionId,
    }: {
      presentationId: string;
      slideKey: string;
      versionId: string;
    }) => api.activateSlideVersion(presentationId, slideKey, versionId),
    onSuccess: (_result, variables) => invalidate(variables.presentationId),
  });
}

export function useCreateExport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      presentationId,
      input,
    }: {
      presentationId: string;
      input: CreateExportInput;
    }) => api.createExport(presentationId, input),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: presentationKeys.exports(variables.presentationId) });
    },
  });
}

export function useJobEventStream(jobId: string | null | undefined, presentationId?: string) {
  const queryClient = useQueryClient();
  const [connected, setConnected] = useState(false);
  const [streamError, setStreamError] = useState(false);
  const lastEventId = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!jobId) return;
    lastEventId.current = undefined;
    const controller = new AbortController();
    let disposed = false;

    async function consume() {
      try {
        for await (const event of api.streamJobEvents(jobId!, controller.signal, lastEventId.current)) {
          if (disposed) return;
          setConnected(true);
          setStreamError(false);
          if (event.id) lastEventId.current = event.id;
          const payload = event.data as Partial<JobState> | null;
          if (payload && typeof payload === "object") {
            queryClient.setQueryData<JobState>(presentationKeys.job(jobId!), (current) => {
              const status =
                typeof payload.status === "string"
                  ? payload.status
                  : current?.status ?? "processing";
              return {
                ...current,
                ...payload,
                id: jobId!,
                status,
              };
            });
          }
          if (presentationId) {
            queryClient.invalidateQueries({ queryKey: presentationKeys.detail(presentationId) });
          }
          const eventStatus =
            payload && typeof payload.status === "string" ? payload.status.toLowerCase() : "";
          const eventName = event.event.toLowerCase();
          if (
            eventName === "completed" ||
            eventName === "completed_with_errors" ||
            eventName === "failed" ||
            eventName === "cancelled" ||
            eventName.endsWith(".completed") ||
            eventName.endsWith(".failed") ||
            eventName.endsWith(".cancelled") ||
            terminalJobStatuses.has(eventStatus)
          ) {
            break;
          }
        }
      } catch (error) {
        if (!disposed && !(error instanceof DOMException && error.name === "AbortError")) {
          setStreamError(true);
        }
      } finally {
        if (!disposed) setConnected(false);
      }
    }

    void consume();
    return () => {
      disposed = true;
      controller.abort();
    };
  }, [jobId, presentationId, queryClient]);

  return { connected, streamError };
}

export function planVersionId(plan: PresentationPlan | null | undefined) {
  if (!plan) return "";
  const value = plan.plan_version_id ?? plan.version_id ?? plan.id;
  return typeof value === "string" ? value : plan.id;
}

export function jobIdFrom(ref: JobRef | null | undefined) {
  return ref?.job_id ?? "";
}
