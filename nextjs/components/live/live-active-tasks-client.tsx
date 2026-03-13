"use client";

import { TaskCard } from "@/components/platform/tasks/task-card";
import { fetchJson } from "@/lib/client-data/fetch-json";
import type { Task } from "@/lib/data/tasks";
import { useRealtime } from "@/lib/supabase/realtime";
import useSWR from "swr";

async function fetchLiveActiveTasks() {
  const response = await fetchJson<{ tasks: Task[] }>("/api/v1/tasks?status=open&sort=newest&limit=3");
  return response.tasks;
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
