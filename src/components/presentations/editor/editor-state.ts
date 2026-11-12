import type { JobState, PresentationProject } from "@/types/presentations";
import { isTerminalPresentationJob } from "@/lib/presentation-recovery";

export function isActivePresentationJob(job: JobState | null | undefined): boolean {
  return Boolean(job && !isTerminalPresentationJob(job.status));
}

export function generationJobId(
  project: PresentationProject,
  explicit?: string | null,
): string | null {
  if (project.latest_job && ["generate", "regenerate"].includes(project.latest_job.kind ?? "")) {
    return project.latest_job.job_id ?? project.latest_job.id;
  }
  if (explicit) return explicit;
  if (project.active_generation?.job_id) return project.active_generation.job_id;
  const value = project.generation_job_id ?? project.active_job_id;
  return typeof value === "string" ? value : null;
}
