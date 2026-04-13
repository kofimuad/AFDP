"use client";

import { useQuery } from "@tanstack/react-query";

import { searchFood } from "@/lib/api";
import type { SearchResponse } from "@/types";

interface UseSearchOptions {
  q: string;
  lat?: number;
  lng?: number;
  radiusKm?: number;
}

interface UseSearchResult {
  data: SearchResponse | undefined;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  error: Error | null;
}

export function useSearch({ q, lat, lng, radiusKm }: UseSearchOptions): UseSearchResult {
  const cleanedQuery = q.trim();
  const hasCoordinates = typeof lat === "number" && typeof lng === "number";

  const query = useQuery({
    queryKey: ["search", cleanedQuery, lat, lng, radiusKm],
    queryFn: () => searchFood(cleanedQuery, lat as number, lng as number, radiusKm),
    enabled: cleanedQuery.length > 0 && hasCoordinates
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error as Error | null
  };
}