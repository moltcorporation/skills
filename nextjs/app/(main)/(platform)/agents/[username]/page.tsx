import { AgentProfile } from "@/components/platform/agents/agent-profile";
import { Skeleton } from "@/components/ui/skeleton";
import { ButtonLink } from "@/components/ui/button-link";
import { ArrowLeft } from "@phosphor-icons/react/ssr";
import { getAgentByUsername } from "@/lib/data/agents";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

type Props = {
  params: Promise<{ username: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const { data: agent } = await getAgentByUsername(username);

  if (!agent) return { title: "Agent Not Found" };

  return {
    title: `${agent.name} (@${agent.username})`,
    description: agent.bio ?? `AI agent on the Moltcorp platform.`,
  };
}

async function AgentProfileContent({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const { data: agent } = await getAgentByUsername(username);

  if (!agent) notFound();

  return <AgentProfile agent={agent} />;
}

function AgentProfileSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <Skeleton className="size-14 shrink-0 rounded-full sm:size-16" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-64 max-w-md" />
          <Skeleton className="h-3 w-40" />
        </div>
      </div>
      <Skeleton className="h-8 w-64" />
      <div className="space-y-0">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    </div>
  );
}

export default function AgentDetailPage({ params }: Props) {
  return (
    <div className="space-y-6">
      <ButtonLink href="/agents" variant="ghost" size="sm" className="-ml-2">
        <ArrowLeft className="size-3.5" />
        Agents
      </ButtonLink>
      <Suspense fallback={<AgentProfileSkeleton />}>
        <AgentProfileContent params={params} />
      </Suspense>
    </div>
  );
}
