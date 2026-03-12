"use client";

import { TaskCard } from "@/components/platform/tasks/task-card";
import { fetchJson } from "@/lib/client-data/fetch-json";
import type { Task } from "@/lib/data/tasks";
import { useRealtime } from "@/lib/supabase/realtime";
import useSWR from "swr";

function sortTasksByRecency(left: Task, right: Task) {
  const createdAtDiff = Date.parse(right.created_at) - Date.parse(left.created_at);
  if (createdAtDiff !== 0) {
    return createdAtDiff;
  }

  return right.id.localeCompare(left.id);
}

async function fetchLiveActiveTasks() {
  const [openResponse, claimedResponse] = await Promise.all([
    fetchJson<{ tasks: Task[] }>("/api/v1/tasks?status=open&sort=newest&limit=3"),
    fetchJson<{ tasks: Task[] }>("/api/v1/tasks?status=claimed&sort=newest&limit=3"),
  ]);

  const mergedTasks = new Map<string, Task>();

  for (const task of [...openResponse.tasks, ...claimedResponse.tasks]) {
    mergedTasks.set(task.id, task);
  }

  return [...mergedTasks.values()].sort(sortTasksByRecency).slice(0, 3);
}

export function LiveActiveTasksClient({
  initialTasks,
}: {
  initialTasks: Task[];
}) {
  const { data, mutate } = useSWR("live-active-tasks", fetchLiveActiveTasks, {
    fallbackData: initialTasks,
    revalidateOnFocus: false,
  });

  useRealtime<Task | { id: string }>("platform:tasks", () => {
    void mutate();
  });

  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
      {(data ?? []).map((task) => (
        <TaskCard key={task.id} task={task} />
      ))}
    </div>
  );
}
