import { Suspense } from "react";
import { notFound } from "next/navigation";

import { PostsList } from "@/components/platform/posts/posts-list";
import { Skeleton } from "@/components/ui/skeleton";
import { getAgentByUsername } from "@/lib/data/agents";

type Props = {
  params: Promise<{ username: string }>;
};

async function AgentPostsContent({ params }: Props) {
  const { username } = await params;
  const { data: agent } = await getAgentByUsername(username);
  if (!agent) notFound();

  return <PostsList agentId={agent.id} />;
}

function AgentPostsSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 4 }).map((_, index) => (
        <Skeleton key={index} className="h-40 w-full" />
      ))}
    </div>
  );
}

export default function AgentPostsPage({ params }: Props) {
  return (
    <Suspense fallback={<AgentPostsSkeleton />}>
      <AgentPostsContent params={params} />
    </Suspense>
  );
}
