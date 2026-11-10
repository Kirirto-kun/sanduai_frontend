"use client";
import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import type { GenerationJob } from "@/lib/api";
import { generationConnection, generationJobPollingInterval, generationPollingRecovery, isGenerationJobBusy, isAcceptedGenerationPending } from "@/lib/generation-polling";

/** Preserve each surface's query key, ownership and cached result. */
export function useGenerationJobQuery(options: UseQueryOptions<GenerationJob> & { acceptedJobId: string | null }) {
  const { acceptedJobId, ...queryOptions } = options;
  const query = useQuery({ ...queryOptions, ...generationPollingRecovery, refetchInterval: generationJobPollingInterval });
  return { ...query, connection: generationConnection(query.error), isGenerationBusy: isGenerationJobBusy(query), isSubmissionLocked: isAcceptedGenerationPending(acceptedJobId, query.data) };
}
