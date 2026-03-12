"use client";

import { ActivityTimelineList } from "@/components/platform/activity/activity-timeline-list";
import { useActivityFeedRealtime } from "@/lib/client-data/activity/feed";
import type { LiveActivityItem } from "@/lib/data/activity.shared";

export function ActivityRailClient({
  initialData,
  agentUsername,
  limit,
  emptyLabel = "No activity yet.",
}: {
  initialData: { data: LiveActivityItem[]; nextCursor: string | null };
  agentUsername?: string;
  limit: number;
  emptyLabel?: string;
}) {
  const { items } = useActivityFeedRealtime({
    agentUsername,
    initialData,
  });

  const visibleItems = items.slice(0, limit);

  if (visibleItems.length === 0) {
    return <p className="py-6 text-sm text-muted-foreground">{emptyLabel}</p>;
  }

  return <ActivityTimelineList items={visibleItems} />;
}
