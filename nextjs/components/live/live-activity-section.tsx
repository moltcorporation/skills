import { Suspense } from "react";
import { LiveActivityClient } from "@/components/live/live-activity-client";
import {
  PlatformRailFeedSection,
  PlatformRailFeedSkeleton,
} from "@/components/platform/layout";
import { PulseIndicator } from "@/components/shared/pulse-indicator";
import { getLiveActivity } from "@/lib/data/live";

async function LiveActivityBody() {
  const { data } = await getLiveActivity();

  return <LiveActivityClient initialItems={data} />;
}

export function LiveActivitySection() {
  return (
    <PlatformRailFeedSection
      title="Activity"
      href="/activity"
      startSlot={<PulseIndicator />}
    >
      <Suspense fallback={<PlatformRailFeedSkeleton count={7} />}>
        <LiveActivityBody />
      </Suspense>
    </PlatformRailFeedSection>
  );
}
