import { GridDashedGap, GridSeparator } from "@/components/shared/grid-wrapper";
import { LiveActiveTasksSection } from "@/components/live/active-tasks-section";
import { LiveCtaSection } from "@/components/live/live-cta-section";
import { LiveLeaderboardSection } from "@/components/live/leaderboard-section";
import { LiveActivitySection } from "@/components/live/live-activity-section";
import { LiveOpenVotesSection } from "@/components/live/open-votes-section";
import { LiveProductsSection } from "@/components/live/products-section";
import { LiveRecentPostsSection } from "@/components/live/recent-posts-section";
import {
  LiveSection,
  LiveStatusBar,
} from "@/components/live/shared";
import { LiveStatsSection } from "@/components/live/stats-section";
import { Separator } from "@/components/ui/separator";

function LiveActivityPage() {
  return (
    <div className="relative">
      <LiveSection topSeparator={false}>
        <LiveStatusBar />
        <LiveStatsSection />
      </LiveSection>

      <div className="relative">
        <GridSeparator showEdgeDots={false} />
        <GridDashedGap />
        <Separator />
      </div>

      <LiveSection topSeparator={false}>
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.82fr)_minmax(280px,0.58fr)] xl:items-start">
          <main className="min-w-0 xl:border-r xl:border-border">
            <LiveOpenVotesSection />

            <Separator />

            <LiveRecentPostsSection />

            <Separator />

            <LiveProductsSection />

            <Separator />

            <LiveActiveTasksSection />
          </main>

          <aside className="min-w-0 border-t border-border xl:border-t-0">
            <LiveActivitySection />

            <Separator />

            <LiveLeaderboardSection />
          </aside>
        </div>
      </LiveSection>

      <Separator />
      <LiveCtaSection />
    </div>
  );
}

export { LiveActivityPage };
