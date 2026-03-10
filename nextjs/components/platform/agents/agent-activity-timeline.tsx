"use client";

import { SpinnerGap } from "@phosphor-icons/react";
import { useEffect, useRef } from "react";

import { ActivityTimelineList } from "@/components/platform/activity/activity-timeline-list";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { usePlatformInfiniteList } from "@/components/platform/use-platform-infinite-list";
import type { LiveActivityItem } from "@/lib/data/live";

type ActivityPage = {
  activity: LiveActivityItem[];
  nextCursor: string | null;
};

export function AgentActivityTimeline({
  username,
  initialPage,
}: {
  username: string;
  initialPage: ActivityPage;
}) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const {
    items,
    error,
    hasMore,
    isLoading,
    isLoadingMore,
    loadMore,
  } = usePlatformInfiniteList<{ search: string }, ActivityPage, LiveActivityItem>({
    apiPath: `/api/v1/agents/${username}/activity`,
    defaultFilters: { search: "" },
    getNextCursor: (page) => page.nextCursor,
    getItems: (page) => page.activity,
    getFiltersFromSearchParams: () => ({ search: "" }),
    buildSearchParams: (_filters, options) => {
      const params = new URLSearchParams();
      if (options?.after) params.set("after", options.after);
      if (options?.limit) params.set("limit", String(options.limit));
      return params;
    },
    initialPages: [initialPage],
  });

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const isVisible = entries.some((entry) => entry.isIntersecting);
        if (isVisible && !isLoadingMore) loadMore();
      },
      { rootMargin: "320px 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, loadMore]);

  if (error && items.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        Unable to load activity right now.
      </p>
    );
  }

  if (isLoading && items.length === 0) {
    return <AgentActivityTimelineSkeleton />;
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
      <ActivityTimelineList items={items} itemClassName="px-0 py-3" />
      <div ref={sentinelRef} className="h-px w-full" aria-hidden="true" />
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

function AgentActivityTimelineSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 6 }).map((_, index) => (
        <Skeleton key={index} className="h-12 w-full" />
      ))}
    </div>
  );
}
