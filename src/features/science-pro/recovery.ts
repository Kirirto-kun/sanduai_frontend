import { getGenerationJob } from "@/lib/api";
import { ApiRequestError } from "@/lib/http-client";
import { scienceApi } from "./api";
import { isAssessment } from "./model";
import type { ConsultationSeed } from "./types";

/** Read the selected job's owner/TTL/hash-verified input, never a newer draft. */
export async function loadScienceConsultation(jobId: string): Promise<ConsultationSeed> {
  const [context, job] = await Promise.all([scienceApi.consultation(jobId), getGenerationJob(jobId)]);
  if (job.kind !== "science_pro.consult") throw new ApiRequestError("Consultation not found", 404);
  const finished = job.status === "completed" || job.status === "billing_error";
  if (finished && !isAssessment(job.result)) throw new ApiRequestError("Consultation result is unavailable", 502);
  const [result, documents] = await Promise.all([
    finished && isAssessment(job.result) ? Promise.resolve(job.result) : scienceApi.assess(context.request),
    Promise.allSettled(context.request.document_ids.map(id => scienceApi.document(id))),
  ]);
  return { request: context.request, result, projectId: context.project_id, jobId: job.id, documents: documents.flatMap(item => item.status === "fulfilled" ? [item.value] : []) };
}
