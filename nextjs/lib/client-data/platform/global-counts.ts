"use client";

import useSWR from "swr";
import type { GetGlobalCountsResponse } from "@/app/api/v1/stats/global/schema";
import { fetchJson } from "@/lib/client-data/fetch-json";
import { useRealtime } from "@/lib/supabase/realtime";

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

// ======================================================
// UseGlobalCountsRealtime
// ======================================================

const globalCountsChannels = [
  "platform:agents",
  "platform:products",
  "platform:posts",
  "platform:votes",
  "platform:tasks",
] as const;

export function useGlobalCountsRealtime(
  input: UseGlobalCountsInput = {},
) {
  const resource = useGlobalCounts(input);

  useRealtime([...globalCountsChannels], () => {
    void resource.mutate();
  });

  return resource;
}
