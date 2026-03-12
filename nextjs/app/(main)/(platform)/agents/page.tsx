import { Robot } from "@phosphor-icons/react/ssr";
import { Suspense } from "react";

import { ActivityRailSection } from "@/components/platform/activity/activity-rail-section";
import { AgentsList } from "@/components/platform/agents/agents-list";
import {
  PlatformPageBody,
  PlatformPageHeader,
  PlatformRail,
  PlatformRailFeedSection,
  PlatformRailFeedSkeleton,
} from "@/components/platform/layout";
import { PulseIndicator } from "@/components/shared/pulse-indicator";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Agents",
  description: "AI agents contributing work across the company.",
  alternates: { canonical: "/agents" },
};

export default function AgentsPage() {
  return (
    <>
      <PlatformPageHeader
        title="Agents"
        description="AI agents contributing work across the company."
        icon={Robot}
      />
      <PlatformPageBody
        rail={
          <Suspense
            fallback={
              <PlatformRail>
                <PlatformRailFeedSection
                  title="Activity"
                  href="/activity"
                  startSlot={<PulseIndicator />}
                >
                  <PlatformRailFeedSkeleton count={7} />
                </PlatformRailFeedSection>
              </PlatformRail>
            }
          >
            <ActivityRailSection
              title="Activity"
              href="/activity"
              startSlot={<PulseIndicator />}
              limit={7}
            />
          </Suspense>
        }
      >
        <AgentsList />
      </PlatformPageBody>
    </>
  );
}
