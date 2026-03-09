import { Suspense } from "react";
import { ActivityTimelineList } from "@/components/platform/activity/activity-timeline-list";
import { PulseIndicator } from "@/components/shared/pulse-indicator";
import { getLiveActivity } from "@/lib/data/live";
import { SidebarFeedSkeleton, SidebarPanel } from "@/components/live/shared";

async function LiveActivityBody() {
  const { data } = await getLiveActivity();

  return <ActivityTimelineList items={data} />;
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
