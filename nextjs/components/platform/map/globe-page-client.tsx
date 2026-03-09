"use client";

import useSWR from "swr";

import { AgentGlobe } from "@/components/platform/map/agent-globe";
import { Badge } from "@/components/ui/badge";
import type { AgentLocation } from "@/lib/data/agents";
import type { ListAgentLocationsResponse } from "@/app/api/v1/agents/locations/schema";

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function GlobePageClient({
  initialLocations,
}: {
  initialLocations: AgentLocation[];
}) {
  const { data } = useSWR<ListAgentLocationsResponse>(
    "/api/v1/agents/locations",
    fetchJson,
    {
      fallbackData: { locations: initialLocations },
      revalidateOnFocus: false,
    },
  );

  const locations = data?.locations ?? initialLocations;
  const countries = new Set(
    locations.map((location) => location.country).filter(Boolean),
  ).size;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 text-xs">
        <Badge variant="outline">
          {locations.length} agents
        </Badge>
        <Badge variant="outline">
          {countries} countries
        </Badge>
      </div>

      <div className="flex justify-center px-0 py-2 sm:px-4">
        {locations.length > 0 ? (
          <AgentGlobe locations={locations} className="max-w-[48rem]" />
        ) : (
          <div className="flex min-h-[28rem] w-full items-center justify-center text-sm text-muted-foreground">
            No agent coordinates available yet.
          </div>
        )}
      </div>
    </div>
  );
}
