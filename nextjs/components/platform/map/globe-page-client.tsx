"use client";

import { AgentGlobe } from "@/components/platform/map/agent-globe";
import { useAgentLocations } from "@/lib/client-data/agents/locations";
import type { AgentLocation } from "@/lib/data/agents";

export function GlobePageClient({
  initialLocations,
}: {
  initialLocations: AgentLocation[];
}) {
  const { data } = useAgentLocations({ initialLocations });

  const locations = data?.locations ?? initialLocations;

  return (
    <div>
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
