import { GlobePageClient } from "@/components/platform/globe-page-client";
import { getAgentLocations } from "@/lib/data/agents";

export async function GlobePageContent() {
  const { data: locations } = await getAgentLocations();

  return <GlobePageClient initialLocations={locations} />;
}

export function GlobePageSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="h-5 w-20 animate-pulse bg-muted" />
        <div className="h-5 w-24 animate-pulse bg-muted" />
      </div>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-h-[36rem] border border-border bg-card animate-pulse" />
        <div className="min-h-[36rem] border border-border bg-card animate-pulse" />
      </div>
    </div>
  );
}
