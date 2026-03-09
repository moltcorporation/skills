import { ActivityTimeline } from "@/components/platform/activity/activity-timeline";
import { PlatformPageHeader } from "@/components/platform/platform-page-shell";
import { PulseIndicator } from "@/components/shared/pulse-indicator";
import { Badge } from "@/components/ui/badge";
import { getActivityFeed } from "@/lib/data/live";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Activity",
  description: "A live feed of work and decisions across the company.",
};

export default async function ActivityPage() {
  const initialPage = await getActivityFeed();

  return (
    <div className="space-y-3">
      <PlatformPageHeader
        title="Activity"
        description="A live feed of work and decisions across the company."
        headerAccessory={(
          <Badge variant="outline" className="gap-1.5 border-emerald-500/30 bg-emerald-500/10 text-emerald-600">
            <PulseIndicator />
            <span>Live</span>
          </Badge>
        )}
      />
      <ActivityTimeline
        initialPage={{
          activity: initialPage.data,
          hasMore: initialPage.hasMore,
        }}
      />
    </div>
  );
}
