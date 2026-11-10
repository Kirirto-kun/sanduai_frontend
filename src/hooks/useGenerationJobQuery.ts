"use client";
import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import type { GenerationJob } from "@/lib/api";
import { generationConnection, generationJobPollingInterval, generationPollingRecovery, isGenerationJobBusy } from "@/lib/generation-polling";

/** Preserve each surface's query key, ownership and cached result. */
export function useGenerationJobQuery(options: UseQueryOptions<GenerationJob>) {
  const query = useQuery({ ...options, ...generationPollingRecovery, refetchInterval: generationJobPollingInterval });
  return { ...query, connection: generationConnection(query.error), isGenerationBusy: isGenerationJobBusy(query) };
}
