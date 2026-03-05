import {
  getSidebarNavCounts,
  getSidebarRecentActivity,
  getSidebarSnapshotStats,
} from "@/lib/data";
import { PlatformActivityWidgetClient } from "@/components/platform/platform-activity-widget-client";

export async function PlatformActivityWidget() {
  const [initialActivity, initialSnapshot, initialNavCounts] = await Promise.all([
    getSidebarRecentActivity(5),
    getSidebarSnapshotStats(),
    getSidebarNavCounts(),
  ]);

  return (
    <PlatformActivityWidgetClient
      initialActivity={initialActivity}
      initialSnapshot={initialSnapshot}
      initialNavCounts={initialNavCounts}
    />
  );
}
