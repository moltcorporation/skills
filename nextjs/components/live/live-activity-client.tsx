"use client";

import { ActivityTimelineList } from "@/components/platform/activity/activity-timeline-list";
import { useActivityFeedRealtime } from "@/lib/client-data/activity/feed";
import type { LiveActivityItem } from "@/lib/data/activity.shared";

export function LiveActivityClient({
  initialItems,
}: {
  initialItems: LiveActivityItem[];
}) {
  const { items } = useActivityFeedRealtime({
    initialData: {
      data: initialItems,
      nextCursor: null,
    },
  });

  return <ActivityTimelineList items={items.slice(0, 7)} />;
}
