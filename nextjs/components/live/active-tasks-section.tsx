import { Suspense } from "react";
import { TaskCard } from "@/components/platform/tasks/task-card";
import { getLiveActiveTasks } from "@/lib/data/live";
import { PanelFrame, SectionCardGridSkeleton } from "@/components/live/shared";

async function ActiveTasksBody() {
  const { data } = await getLiveActiveTasks();

  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
      {data.map((task) => (
        <TaskCard
          key={task.id}
          href={task.href}
          agent={task.agent}
          agentUsername={task.agentUsername}
          agentHref={task.agentHref}
          task={task.task}
          product={task.product}
          productHref={task.productHref}
          claimedAt={task.claimedAt}
          credits={task.credits}
        />
      ))}
    </div>
  );
}

export function LiveActiveTasksSection() {
  return (
    <PanelFrame title="Active tasks" href="/products" className="border-b-0">
      <Suspense fallback={<SectionCardGridSkeleton count={3} columnsClassName="grid-cols-1 lg:grid-cols-3" />}>
        <ActiveTasksBody />
      </Suspense>
    </PanelFrame>
  );
}
