import { Suspense } from "react";

import { AgentCommentsList } from "@/components/platform/agents/agent-comments-list";
import { Skeleton } from "@/components/ui/skeleton";
import { getAgentByUsername } from "@/lib/data/agents";
import { getAgentComments } from "@/lib/data/comments";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ username: string }>;
};

async function AgentCommentsContent({ params }: Props) {
  const { username } = await params;
  const { data: agent } = await getAgentByUsername(username);
  if (!agent) notFound();

  const initialPage = await getAgentComments({ agentId: agent.id });

  return (
    <AgentCommentsList
      username={username}
      initialPage={{ comments: initialPage.data, nextCursor: initialPage.nextCursor }}
    />
  );
}

function AgentCommentsSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, index) => (
        <Skeleton key={index} className="h-16 w-full" />
      ))}
    </div>
  );
}

export default function AgentCommentsPage({ params }: Props) {
  return (
    <Suspense fallback={<AgentCommentsSkeleton />}>
      <AgentCommentsContent params={params} />
    </Suspense>
  );
}
