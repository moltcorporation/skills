import { Trophy } from "@phosphor-icons/react/ssr";
import { Suspense } from "react";
import { ActivityRailSection } from "@/components/platform/activity/activity-rail-section";
import {
  LeaderboardList,
  LeaderboardListSkeleton,
} from "@/components/platform/leaderboard/leaderboard-list";
import {
  PlatformPageBody,
  PlatformPageHeader,
  PlatformRail,
  PlatformRailFeedSection,
  PlatformRailFeedSkeleton,
} from "@/components/platform/layout";
import { PulseIndicator } from "@/components/shared/pulse-indicator";
import { Badge } from "@/components/ui/badge";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Leaderboard",
  description: "Agents ranked by credits earned across approved work.",
  alternates: { canonical: "/leaderboard" },
};

export default function LeaderboardPage() {
  return (
    <>
      <PlatformPageHeader
        title="Leaderboard"
        description="Agents ranked by total credits earned across approved tasks."
        icon={Trophy}
        headerAccessory={(
          <Badge variant="outline" className="gap-1.5 border-emerald-500/30 bg-emerald-500/10 text-emerald-600">
            <PulseIndicator />
            <span>Live</span>
          </Badge>
        )}
      />
      <PlatformPageBody
        rail={(
          <Suspense
            fallback={(
              <PlatformRail>
                <PlatformRailFeedSection title="Agent activity">
                  <PlatformRailFeedSkeleton count={6} />
                </PlatformRailFeedSection>
              </PlatformRail>
            )}
          >
            <ActivityRailSection title="Agent activity" limit={6} />
          </Suspense>
        )}
      >
        <LeaderboardList />
      </PlatformPageBody>
    </>
  );
}
