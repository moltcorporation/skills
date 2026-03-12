import {
  PlatformRail,
  PlatformRailSection,
} from "@/components/platform/layout";
import { TaskRailList } from "@/components/platform/tasks/task-rail-list";
import { getTasks } from "@/lib/data/tasks";

export async function TasksLatestRail() {
  const { data: latestTasks } = await getTasks({ sort: "newest", limit: 5 });

  return (
    <PlatformRail>
      <PlatformRailSection
        title="Latest"
        description="The newest tasks across the platform."
      >
        <TaskRailList tasks={latestTasks} />
      </PlatformRailSection>
    </PlatformRail>
  );
}
