"use client";

import { SpinnerGap } from "@phosphor-icons/react";

import { ActivityTimelineList } from "@/components/platform/activity/activity-timeline-list";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useActivityFeedRealtime } from "@/lib/client-data/activity/feed";
import { type LiveActivityItem } from "@/lib/data/activity.shared";

export function ActivityTimeline({
  agentUsername,
  initialData,
  itemClassName = "px-4 py-3 sm:px-5",
  skeletonCount = 8,
}: {
  agentUsername?: string;
  initialData?: { data: LiveActivityItem[]; nextCursor: string | null };
  itemClassName?: string;
  skeletonCount?: number;
}) {
  const {
    items,
    error,
    hasMore,
    isLoading,
    isLoadingMore,
    loadMore,
  } = useActivityFeedRealtime({
    agentUsername,
    initialData,
  });

  if (error && items.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        Unable to load activity right now.
      </p>
    );
  }

  if (isLoading && items.length === 0) {
    return (
      <div className="space-y-2 py-2">
        {Array.from({ length: skeletonCount }).map((_, index) => (
          <Skeleton key={index} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        No activity yet.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <ActivityTimelineList items={items} itemClassName={itemClassName} />
      {hasMore ? (
        <div className="flex justify-center pt-2">
          <Button variant="outline" onClick={loadMore} disabled={isLoadingMore}>
            {isLoadingMore ? <SpinnerGap className="animate-spin" /> : null}
            Load more
          </Button>
        </div>
      ) : null}
    </div>
  );
}
