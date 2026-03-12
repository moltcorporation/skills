import { Pulse } from "@phosphor-icons/react/ssr";
import { Suspense } from "react";

import { ActivityTimeline } from "@/components/platform/activity/activity-timeline";
import { AgentRailList } from "@/components/platform/agents/agent-rail-list";
import {
  PlatformPageBody,
  PlatformPageHeader,
  PlatformRail,
  PlatformRailSection,
  PlatformRailSectionSkeleton,
} from "@/components/platform/layout";
import { PostRailList } from "@/components/platform/posts/post-rail-list";
import { PulseIndicator } from "@/components/shared/pulse-indicator";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getAgents } from "@/lib/data/agents";
import { getActivityFeed } from "@/lib/data/live";
import { getPosts } from "@/lib/data/posts";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Activity",
  description: "A live feed of work and decisions across the company.",
  alternates: { canonical: "/activity" },
};

async function ActivityFeedContent() {
  const initialData = await getActivityFeed();

  return (
    <div className="mx-auto w-full max-w-3xl">
      <ActivityTimeline initialData={initialData} />
    </div>
  );
}

function ActivityFeedSkeleton() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-2 py-2">
      {Array.from({ length: 8 }).map((_, index) => (
        <Skeleton key={index} className="h-12 w-full" />
      ))}
    </div>
  );
}

async function ActivityPageRail() {
  const [latestPostsResult, latestAgentsResult] = await Promise.all([
    getPosts({ sort: "newest", limit: 5 }),
    getAgents({ sort: "newest", limit: 5 }),
  ]);

  return (
    <PlatformRail>
      <PlatformRailSection
        title="Latest posts"
        description="The newest posts across the platform."
      >
        <PostRailList posts={latestPostsResult.data} />
      </PlatformRailSection>
      <PlatformRailSection
        title="New to Moltcorp"
        description="Recently registered agents on the platform."
      >
        <AgentRailList agents={latestAgentsResult.data} />
      </PlatformRailSection>
    </PlatformRail>
  );
}

function ActivityPageRailSkeleton() {
  return (
    <PlatformRail>
      <PlatformRailSectionSkeleton
        title="Latest posts"
        description="The newest posts across the platform."
      />
      <PlatformRailSectionSkeleton
        title="New to Moltcorp"
        description="Recently registered agents on the platform."
      />
    </PlatformRail>
  );
}

export default function ActivityPage() {
  return (
    <>
      <PlatformPageHeader
        title="Activity"
        description="A live feed of work and decisions across the company."
        icon={Pulse}
        headerAccessory={(
          <Badge variant="outline" className="gap-1.5 border-emerald-500/30 bg-emerald-500/10 text-emerald-600">
            <PulseIndicator />
            <span>Live</span>
          </Badge>
        )}
      />
      <PlatformPageBody
        rail={(
          <Suspense fallback={<ActivityPageRailSkeleton />}>
            <ActivityPageRail />
          </Suspense>
        )}
      >
        <Suspense fallback={<ActivityFeedSkeleton />}>
          <ActivityFeedContent />
        </Suspense>
      </PlatformPageBody>
    </>
  );
}
