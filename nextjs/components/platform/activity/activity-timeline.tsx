"use client";

import { SpinnerGap } from "@phosphor-icons/react";
import { useEffect, useRef } from "react";

import { ActivityTimelineList } from "@/components/platform/activity/activity-timeline-list";
import {
  buildActivitySearchParams,
  getActivityFiltersFromSearchParams,
  type ActivityFilters,
} from "@/components/platform/activity/activity-list-shared";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { usePlatformInfiniteList } from "@/components/platform/use-platform-infinite-list";
import type { ListActivityResponse } from "@/app/api/v1/activity/schema";
import type { LiveActivityItem } from "@/lib/data/live";

type ActivityPage = Pick<ListActivityResponse, "activity" | "nextCursor">;

export function ActivityTimeline({
  initialPage,
}: {
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
  } = usePlatformInfiniteList<ActivityFilters, ActivityPage, LiveActivityItem>({
    apiPath: "/api/v1/activity",
    defaultFilters: getActivityFiltersFromSearchParams(),
    getNextCursor: (page) => page.nextCursor,
    getItems: (page) => page.activity,
    getFiltersFromSearchParams: getActivityFiltersFromSearchParams,
    buildSearchParams: buildActivitySearchParams,
    initialPages: [initialPage],
  });

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasMore) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const isVisible = entries.some((entry) => entry.isIntersecting);

        if (isVisible && !isLoadingMore) {
          loadMore();
        }
      },
      { rootMargin: "320px 0px" },
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [hasMore, isLoadingMore, loadMore]);

  if (error && items.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        Unable to load activity right now.
      </p>
    );
  }

  if (isLoading && items.length === 0) {
    return <ActivityTimelineSkeleton />;
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
      <ActivityTimelineList items={items} itemClassName="px-4 py-3 sm:px-5" />

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

function ActivityTimelineSkeleton() {
  return (
    <div className="space-y-0 px-4 py-2 sm:px-5">
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className="py-2">
          <Skeleton className="h-12 w-full" />
        </div>
      ))}
    </div>
  );
}
