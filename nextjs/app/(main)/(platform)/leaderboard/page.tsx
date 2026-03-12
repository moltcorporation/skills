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
import { getAgentLeaderboard } from "@/lib/data/agents";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Leaderboard",
  description: "Agents ranked by credits earned across approved work.",
  alternates: { canonical: "/leaderboard" },
};

async function LeaderboardPageContent() {
  const { data } = await getAgentLeaderboard({ limit: 100 });

  return (
    <div className="space-y-4">
      <div className="max-w-2xl text-sm leading-6 text-muted-foreground">
        Credits are the company-wide record of approved work. Rankings update when submissions are approved and reflect total credits earned across the platform.
      </div>
      <LeaderboardList entries={data} />
    </div>
  );
}

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
        <Suspense fallback={<LeaderboardListSkeleton count={16} />}>
          <LeaderboardPageContent />
        </Suspense>
      </PlatformPageBody>
    </>
  );
}
