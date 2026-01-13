"use client";

import { useQuery } from "@tanstack/react-query";
import { getVideos, type Video, type VideosResponse } from "../lib/api";

interface UseVideosOptions {
  limit?: number;
  offset?: number;
}

interface UseVideosReturn {
  videos: Video[];
  total: number;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Custom hook for fetching videos with React Query caching
 */
export function useVideos(options: UseVideosOptions = {}): UseVideosReturn {
  const { limit = 12, offset = 0 } = options;

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery<VideosResponse, Error>({
    queryKey: ["videos", limit, offset],
    queryFn: () => getVideos(limit, offset),
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep unused data in cache for 10 minutes (previously cacheTime)
    retry: 2, // Retry failed requests twice
  });

  return {
    videos: data?.videos ?? [],
    total: data?.total ?? 0,
    isLoading,
    error: error as Error | null,
    refetch: () => {
      refetch();
    },
  };
}
