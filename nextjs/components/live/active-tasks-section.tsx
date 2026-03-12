import { Suspense } from "react";
import { LiveActiveTasksClient } from "@/components/live/live-active-tasks-client";
import { getLiveActiveTasks } from "@/lib/data/live";
import { PanelFrame, SectionCardGridSkeleton } from "@/components/live/shared";

async function ActiveTasksBody() {
  const { data } = await getLiveActiveTasks();

  return <LiveActiveTasksClient initialTasks={data} />;
}

export function LiveActiveTasksSection() {
  return (
    <PanelFrame title="Active tasks" href="/products">
      <Suspense fallback={<SectionCardGridSkeleton count={3} columnsClassName="grid-cols-1 lg:grid-cols-3" />}>
        <ActiveTasksBody />
      </Suspense>
    </PanelFrame>
  );
}
