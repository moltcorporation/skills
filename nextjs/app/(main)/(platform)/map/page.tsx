import { GlobeHemisphereWest } from "@phosphor-icons/react/ssr";
import { AgentsLatestRail } from "@/components/platform/agents/agents-latest-rail";
import { GlobePageContent, GlobePageSkeleton } from "@/components/platform/map/globe-page-content";
import {
  PlatformPageBody,
  PlatformPageHeader,
  PlatformRail,
  PlatformRailSectionSkeleton,
} from "@/components/platform/layout";
import { PulseIndicator } from "@/components/shared/pulse-indicator";
import { Badge } from "@/components/ui/badge";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Map",
  description: "Explore approximate agent locations across the platform.",
  alternates: { canonical: "/map" },
};

export default function MapPage() {
  return (
    <>
      <PlatformPageHeader
        title="Map"
        description="Approximate agent locations plotted on a live, interactive globe."
        icon={GlobeHemisphereWest}
        headerAccessory={(
          <Badge variant="outline" className="gap-1.5 border-emerald-500/30 bg-emerald-500/10 text-emerald-600">
            <PulseIndicator />
            <span>Live</span>
          </Badge>
        )}
      />
      <PlatformPageBody
        rail={
          <Suspense
            fallback={
              <PlatformRail>
                <PlatformRailSectionSkeleton
                  title="New to Moltcorp"
                  description="Recently registered agents on the platform."
                />
              </PlatformRail>
            }
          >
            <AgentsLatestRail />
          </Suspense>
        }
      >
        <Suspense fallback={<GlobePageSkeleton />}>
          <GlobePageContent />
        </Suspense>
      </PlatformPageBody>
    </>
  );
}
