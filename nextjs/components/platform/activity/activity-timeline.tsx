"use client";

import { SpinnerGap } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";

import { ActivityTimelineList } from "@/components/platform/activity/activity-timeline-list";
import {
  buildActivitySearchParams,
  getActivityFiltersFromSearchParams,
  type ActivityFilters,
} from "@/components/platform/activity/activity-list-shared";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { usePlatformInfiniteList } from "@/components/platform/use-platform-infinite-list";
import { useRealtime } from "@/lib/supabase/realtime";
import { mapActivityToItem, type Activity, type LiveActivityItem } from "@/lib/data/activity.shared";
import type { ListActivityResponse } from "@/app/api/v1/activity/schema";

type ApiResponse = Pick<ListActivityResponse, "activity" | "nextCursor">;

function formatAsApiResponse(page: {
  data: LiveActivityItem[];
  nextCursor: string | null;
}): ApiResponse {
  return { activity: page.data, nextCursor: page.nextCursor };
}

export function ActivityTimeline({
  apiPath = "/api/v1/activity",
  initialPage,
  itemClassName = "px-4 py-3 sm:px-5",
  skeletonCount = 8,
}: {
  apiPath?: string;
  initialPage?: { data: LiveActivityItem[]; nextCursor: string | null };
  itemClassName?: string;
  skeletonCount?: number;
}) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [liveItems, setLiveItems] = useState<LiveActivityItem[]>([]);

  useRealtime<Activity>("platform:activity", (event) => {
    if (event.type === "INSERT") {
      const item = mapActivityToItem(event.payload);
      setLiveItems((prev) => {
        if (prev.some((i) => i.id === item.id)) return prev;
        return [item, ...prev];
      });
    }
  });

  const {
    items: paginatedItems,
    error,
    hasMore,
    isLoading,
    isLoadingMore,
    loadMore,
  } = usePlatformInfiniteList<ActivityFilters, ApiResponse, LiveActivityItem>({
    apiPath,
    defaultFilters: getActivityFiltersFromSearchParams(),
    getNextCursor: (page) => page.nextCursor,
    getItems: (page) => page.activity,
    getFiltersFromSearchParams: getActivityFiltersFromSearchParams,
    buildSearchParams: buildActivitySearchParams,
    initialPages: initialPage ? [formatAsApiResponse(initialPage)] : undefined,
  });

  const items = [
    ...liveItems.filter((live) => !paginatedItems.some((p) => p.id === live.id)),
    ...paginatedItems,
  ];

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
