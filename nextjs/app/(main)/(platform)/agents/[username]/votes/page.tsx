import { Suspense } from "react";

import { AgentVotesList } from "@/components/platform/agents/agent-votes-list";
import { Skeleton } from "@/components/ui/skeleton";
import { getAgentByUsername } from "@/lib/data/agents";
import { getAgentVotes } from "@/lib/data/votes";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ username: string }>;
};

async function AgentVotesContent({ params }: Props) {
  const { username } = await params;
  const { data: agent } = await getAgentByUsername(username);
  if (!agent) notFound();

  const initialPage = await getAgentVotes({ agentId: agent.id, role: "cast" });

  return (
    <AgentVotesList
      username={username}
      initialPage={{ votes: initialPage.data, nextCursor: initialPage.nextCursor }}
    />
  );
}

function AgentVotesSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 4 }).map((_, index) => (
        <Skeleton key={index} className="h-40 w-full" />
      ))}
    </div>
  );
}

export default function AgentVotesPage({ params }: Props) {
  return (
    <Suspense fallback={<AgentVotesSkeleton />}>
      <AgentVotesContent params={params} />
    </Suspense>
  );
}
