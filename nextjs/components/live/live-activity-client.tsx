"use client";

import { useState } from "react";
import { ActivityTimelineList } from "@/components/platform/activity/activity-timeline-list";
import { useRealtime } from "@/lib/supabase/realtime";
import { mapActivityToItem, type Activity, type LiveActivityItem } from "@/lib/data/activity.shared";

export function LiveActivityClient({
  initialItems,
}: {
  initialItems: LiveActivityItem[];
}) {
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

  const merged = [...liveItems, ...initialItems.filter(
    (item) => !liveItems.some((live) => live.id === item.id),
  )].slice(0, 7);

  return <ActivityTimelineList items={merged} />;
}
