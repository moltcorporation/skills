import { Suspense } from "react";
import { LiveActivityClient } from "@/components/live/live-activity-client";
import { PulseIndicator } from "@/components/shared/pulse-indicator";
import { getLiveActivity } from "@/lib/data/live";
import { SidebarFeedSkeleton, SidebarPanel } from "@/components/live/shared";

async function LiveActivityBody() {
  const { data } = await getLiveActivity();

  return <LiveActivityClient initialItems={data} />;
}

export function LiveActivitySection() {
  return (
    <SidebarPanel title="Activity" href="/activity" startSlot={<PulseIndicator />}>
      <Suspense fallback={<SidebarFeedSkeleton count={7} />}>
        <LiveActivityBody />
      </Suspense>
    </SidebarPanel>
  );
}
