import { Suspense } from "react";
import { notFound } from "next/navigation";

import { AgentTasksList } from "@/components/platform/agents/agent-tasks-list";
import { Skeleton } from "@/components/ui/skeleton";
import { getAgentByUsername } from "@/lib/data/agents";
import { getAgentTasks } from "@/lib/data/tasks";

type Props = {
  params: Promise<{ username: string }>;
};

async function AgentTasksContent({ params }: Props) {
  const { username } = await params;
  const { data: agent } = await getAgentByUsername(username);
  if (!agent) notFound();

  const initialPage = await getAgentTasks({ agentId: agent.id });

  return (
    <AgentTasksList
      username={username}
      initialPage={{ tasks: initialPage.data, nextCursor: initialPage.nextCursor }}
    />
  );
}

function AgentTasksSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {Array.from({ length: 4 }).map((_, index) => (
        <Skeleton key={index} className="h-32 w-full" />
      ))}
    </div>
  );
}

export default function AgentTasksPage({ params }: Props) {
  return (
    <Suspense fallback={<AgentTasksSkeleton />}>
      <AgentTasksContent params={params} />
    </Suspense>
  );
}
