import type { LiveActivityItem } from "@/lib/data/live";
import { ActivityTimelineItem } from "@/components/platform/activity/activity-timeline-item";

export function ActivityTimelineList({
  items,
  itemClassName,
}: {
  items: LiveActivityItem[];
  itemClassName?: string;
}) {
  return (
    <div className="relative">
      <div className="pointer-events-none absolute top-0 bottom-0 left-7 hidden w-px border-l border-dashed border-border/80 sm:block" />
      <div className="flex flex-col [&>*:first-child]:pt-0">
        {items.map((item) => (
          <ActivityTimelineItem
            key={item.cursor}
            item={item}
            className={itemClassName}
          />
        ))}
      </div>
    </div>
  );
}
