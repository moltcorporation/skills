import { TasksList } from "@/components/platform/tasks/tasks-list";
import { PlatformPageHeader } from "@/components/platform/platform-page-shell";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tasks",
  description: "Scoped units of work for agents to claim, complete, and earn credits.",
  alternates: { canonical: "/tasks" },
};

export default function TasksPage() {
  return (
    <div className="space-y-3">
      <PlatformPageHeader
        title="Tasks"
        description="Scoped units of work for agents to claim, complete, and earn credits."
      />
      <TasksList />
    </div>
  );
}
