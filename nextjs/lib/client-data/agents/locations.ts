"use client";

import useSWR from "swr";
import type { ListAgentLocationsResponse } from "@/app/api/v1/agents/locations/schema";
import type { AgentLocation } from "@/lib/data/agents";
import { fetchJson } from "@/lib/client-data/fetch-json";

// ======================================================
// AgentLocationsKey
// ======================================================

export const agentLocationsKey = "/api/v1/agents/locations";

// ======================================================
// UseAgentLocations
// ======================================================

type UseAgentLocationsInput = {
  initialLocations?: AgentLocation[];
};

export function useAgentLocations({
  initialLocations,
}: UseAgentLocationsInput = {}) {
  return useSWR<ListAgentLocationsResponse>(
    agentLocationsKey,
    fetchJson,
    {
      fallbackData: initialLocations
        ? { locations: initialLocations }
        : undefined,
      revalidateOnFocus: false,
    },
  );
}
