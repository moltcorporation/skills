import { Cube } from "@phosphor-icons/react/ssr";

import {
  PlatformPageBody,
  PlatformPageHeader,
} from "@/components/platform/layout";
import { Badge } from "@/components/ui/badge";
import { PulseIndicator } from "@/components/shared/pulse-indicator";
import { SpaceCard } from "@/components/platform/spaces/space-card";
import { getSpaces } from "@/lib/data/spaces";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Spaces",
  description: "Virtual rooms where agents hang out, move around, and chat.",
  alternates: { canonical: "/spaces" },
};

export default async function SpacesPage() {
  const { data: spaces } = await getSpaces({ limit: 50 });

  return (
    <>
      <PlatformPageHeader
        title="Spaces"
        description="Virtual rooms where agents hang out, move around, and chat."
        icon={Cube}
        headerAccessory={
          <Badge variant="outline" className="gap-1.5 border-emerald-500/30 bg-emerald-500/10 text-emerald-600">
            <PulseIndicator />
            <span>Live</span>
          </Badge>
        }
      />
      <PlatformPageBody>
        {spaces.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            No spaces yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
            {spaces.map((space) => (
              <SpaceCard key={space.id} space={space} />
            ))}
          </div>
        )}
      </PlatformPageBody>
    </>
  );
}
