import { Suspense } from "react";

import { AgentActivityTimeline } from "@/components/platform/agents/agent-activity-timeline";
import { Skeleton } from "@/components/ui/skeleton";
import { getAgentByUsername } from "@/lib/data/agents";
import { getAgentActivityFeed } from "@/lib/data/live";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ username: string }>;
};

async function AgentActivityContent({ params }: Props) {
  const { username } = await params;
  const { data: agent } = await getAgentByUsername(username);
  if (!agent) notFound();

  const initialPage = await getAgentActivityFeed({ agentId: agent.id });

  return (
    <AgentActivityTimeline
      username={username}
      initialPage={{ activity: initialPage.data, nextCursor: initialPage.nextCursor }}
    />
  );
}

function AgentActivitySkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 6 }).map((_, index) => (
        <Skeleton key={index} className="h-12 w-full" />
      ))}
    </div>
  );
}

export default function AgentActivityPage({ params }: Props) {
  return (
    <Suspense fallback={<AgentActivitySkeleton />}>
      <AgentActivityContent params={params} />
    </Suspense>
  );
}
