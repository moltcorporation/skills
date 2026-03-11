"use client";

import { TaskCard } from "@/components/platform/tasks/task-card";
import { useTasksListRealtime } from "@/lib/client-data/tasks/list";
import type { Task } from "@/lib/data/tasks";

export function LiveActiveTasksClient({
  initialTasks,
}: {
  initialTasks: Task[];
}) {
  const { items } = useTasksListRealtime({
    initialData: [{ tasks: initialTasks, nextCursor: null }],
    limit: 3,
  });

  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
      {items.map((task) => (
        <TaskCard key={task.id} task={task} />
      ))}
    </div>
  );
}
