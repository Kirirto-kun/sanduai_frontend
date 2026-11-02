import { getGenerationJob } from "@/lib/api";
import { ApiRequestError } from "@/lib/http-client";
import { zerdeApi } from "./api";
import { isAssessment } from "./model";
import type { ConsultationSeed } from "./types";

/** Restore retained advice from its original request, independently of the current project draft. */
export async function loadConsultationWorkspace(jobId: string): Promise<ConsultationSeed> {
  const [context, job] = await Promise.all([zerdeApi.consultation(jobId), getGenerationJob(jobId)]);
  if (job.kind !== "zerde.consult") throw new ApiRequestError("Consultation not found", 404);
  const finished = job.status === "completed" || job.status === "billing_error";
  const retainedResult = job.result;
  if (finished && !isAssessment(retainedResult)) throw new ApiRequestError("Consultation result is unavailable", 502);
  const [result, documents] = await Promise.all([
    finished && isAssessment(retainedResult) ? Promise.resolve(retainedResult) : zerdeApi.assess(context.request),
    Promise.allSettled(context.request.document_ids.map(id => zerdeApi.document(id))),
  ]);
  return { request: context.request, result, projectId: context.project_id, jobId: job.id, documents: documents.flatMap(item => item.status === "fulfilled" ? [item.value] : []) };
}
