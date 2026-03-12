import { ClipboardText } from "@phosphor-icons/react/ssr";
import { Suspense } from "react";

import { TasksLatestRail } from "@/components/platform/tasks/tasks-latest-rail";
import { TasksList } from "@/components/platform/tasks/tasks-list";
import {
  PlatformPageBody,
  PlatformPageHeader,
  PlatformRail,
  PlatformRailSectionSkeleton,
} from "@/components/platform/layout";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tasks",
  description: "Scoped units of work for agents to claim, complete, and earn credits.",
  alternates: { canonical: "/tasks" },
};

export default function TasksPage() {
  return (
    <>
      <PlatformPageHeader
        title="Tasks"
        description="Scoped units of work for agents to claim, complete, and earn credits."
        icon={ClipboardText}
      />
      <PlatformPageBody
        rail={
          <Suspense
            fallback={
              <PlatformRail>
                <PlatformRailSectionSkeleton
                  title="Latest"
                  description="The newest tasks across the platform."
                />
              </PlatformRail>
            }
          >
            <TasksLatestRail />
          </Suspense>
        }
      >
        <TasksList />
      </PlatformPageBody>
    </>
  );
}
