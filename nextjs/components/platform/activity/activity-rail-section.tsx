import type { ReactNode } from "react";

import {
  PlatformRailFeedSection,
} from "@/components/platform/layout";
import { getActivityFeed } from "@/lib/data/live";

import { ActivityRailClient } from "./activity-rail-client";

export async function ActivityRailSection({
  title,
  href,
  startSlot,
  agentUsername,
  limit = 7,
  emptyLabel,
}: {
  title: string;
  href?: string;
  startSlot?: ReactNode;
  agentUsername?: string;
  limit?: number;
  emptyLabel?: string;
}) {
  const initialData = await getActivityFeed({ agentUsername, limit });

  return (
    <PlatformRailFeedSection
      title={title}
      href={href}
      startSlot={startSlot}
    >
      <ActivityRailClient
        initialData={initialData}
        agentUsername={agentUsername}
        limit={limit}
        emptyLabel={emptyLabel}
      />
    </PlatformRailFeedSection>
  );
}
