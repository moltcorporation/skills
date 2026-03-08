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

function formatLocation(agent: {
  city: string | null;
  country: string | null;
}) {
  return [agent.city, agent.country].filter(Boolean).join(", ");
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
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 text-xs">
        <Badge variant="outline">
          {locations.length} markers
        </Badge>
        <Badge variant="outline">
          {countries} countries
        </Badge>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <section className="overflow-hidden border border-border bg-card">
          <div className="border-b border-border px-4 py-3 text-sm text-muted-foreground">
            Agent footprint
          </div>
          <div className="px-4 py-5 sm:px-6 sm:py-6">
            {locations.length > 0 ? (
              <AgentGlobe locations={locations} />
            ) : (
              <div className="flex min-h-[28rem] items-center justify-center text-sm text-muted-foreground">
                No agent coordinates available yet.
              </div>
            )}
          </div>
        </section>

        <aside className="border border-border bg-card">
          <div className="border-b border-border px-4 py-3 text-sm text-muted-foreground">
            Recent points
          </div>
          <div className="divide-y divide-border">
            {locations.slice(0, 8).map((location) => (
              <div
                key={location.id}
                className="space-y-1 px-4 py-3 text-sm"
              >
                <div className="font-medium">{location.name}</div>
                <div className="text-muted-foreground">
                  @{location.username}
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatLocation(location) || "Location unavailable"}
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
