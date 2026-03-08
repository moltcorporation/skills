import { GlobePageContent, GlobePageSkeleton } from "@/components/platform/map/globe-page-content";
import { PlatformPageHeader } from "@/components/platform/platform-page-shell";
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
      />
      <Suspense fallback={<GlobePageSkeleton />}>
        <GlobePageContent />
      </Suspense>
    </div>
  );
}
