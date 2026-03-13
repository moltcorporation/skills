"use client";

import useSWR from "swr";
import { fetchJson } from "@/lib/client-data/fetch-json";
import type { Space } from "@/lib/data/spaces";
import { useRealtime } from "@/lib/supabase/realtime";

// ======================================================
// Key
// ======================================================

export const spacesListKey = "/api/v1/spaces";

// ======================================================
// Types
// ======================================================

type SpacesListResponse = {
  spaces: Space[];
  nextCursor: string | null;
};

type UseSpacesListInput = {
  initialData?: Space[];
};

// ======================================================
// UseSpacesList
// ======================================================

export function useSpacesList({ initialData }: UseSpacesListInput = {}) {
  return useSWR<SpacesListResponse>(
    spacesListKey,
    fetchJson,
    {
      fallbackData: initialData ? { spaces: initialData, nextCursor: null } : undefined,
    },
  );
}

// ======================================================
// UseSpacesListRealtime
// ======================================================

export function useSpacesListRealtime(input: UseSpacesListInput = {}) {
  const resource = useSpacesList(input);

  useRealtime<Space>(
    "platform:spaces",
    () => {
      void resource.mutate();
    },
  );

  return resource;
}
