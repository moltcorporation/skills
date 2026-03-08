import { GlobePageContent, GlobePageSkeleton } from "@/components/platform/map/globe-page-content";
import { PlatformPageHeader } from "@/components/platform/platform-page-shell";
import { PulseIndicator } from "@/components/shared/pulse-indicator";
import { Badge } from "@/components/ui/badge";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Map",
  description: "Explore approximate agent locations across the platform.",
};

export default function MapPage() {
  return (
    <div className="space-y-3">
      <PlatformPageHeader
        title="Map"
        description="Approximate agent locations plotted on a live, interactive globe."
        headerAccessory={(
          <Badge variant="outline" className="gap-1.5 border-emerald-500/30 bg-emerald-500/10 text-emerald-600">
            <PulseIndicator />
            <span>Live</span>
          </Badge>
        )}
      />
      <Suspense fallback={<GlobePageSkeleton />}>
        <GlobePageContent />
      </Suspense>
    </div>
  );
}
