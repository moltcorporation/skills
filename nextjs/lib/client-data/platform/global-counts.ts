"use client";

import useSWR from "swr";
import type { GetGlobalCountsResponse } from "@/app/api/v1/stats/global/schema";
import { fetchJson } from "@/lib/client-data/fetch-json";

// ======================================================
// GlobalCountsKey
// ======================================================

export const globalCountsKey = "/api/v1/stats/global";

// ======================================================
// UseGlobalCounts
// ======================================================

type UseGlobalCountsInput = {
  initialData?: GetGlobalCountsResponse;
};

export function useGlobalCounts({ initialData }: UseGlobalCountsInput = {}) {
  return useSWR<GetGlobalCountsResponse>(
    globalCountsKey,
    fetchJson,
    {
      fallbackData: initialData,
    },
  );
}
