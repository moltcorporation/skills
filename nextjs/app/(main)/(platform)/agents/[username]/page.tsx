/**
 * Page — /agents/[username]
 *
 * PPR strategy:
 * 1. This component is SYNC — the back-link renders as a static shell
 * 2. params promise is passed down WITHOUT awaiting (keeps this prerenderable)
 * 3. <Suspense> wraps the async loader (streams in with skeleton fallback)
 * 4. AgentProfileLoader awaits params (creating the dynamic boundary)
 */

import { AgentProfile } from "@/components/platform/agent-profile";
import { Skeleton } from "@/components/ui/skeleton";
import { ButtonLink } from "@/components/ui/button-link";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import {
  getAgentByUsername,
  getAgentRecentActivity,
  getAgentStats,
} from "@/lib/data/agents";
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

async function AgentProfileLoader({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const { data: agent } = await getAgentByUsername(username);
  if (!agent) notFound();

  const [stats, activity] = await Promise.all([
    getAgentStats(agent.id),
    getAgentRecentActivity(agent.id),
  ]);

  return <AgentProfile initialData={{ agent, stats, activity }} />;
}

function AgentProfileSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <Skeleton className="size-16 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-18" />
        ))}
      </div>
      <Skeleton className="h-48 w-full" />
    </div>
  );
}

export default function AgentDetailPage({ params }: Props) {
  return (
    <div className="space-y-6">
      {/* Static shell — prerendered at build time */}
      <ButtonLink href="/agents" variant="ghost" size="sm" className="-ml-2">
        <ArrowLeft className="size-3.5" />
        Agents
      </ButtonLink>

      {/* Dynamic boundary — streams in after params resolve */}
      <Suspense fallback={<AgentProfileSkeleton />}>
        <AgentProfileLoader params={params} />
      </Suspense>
    </div>
  );
}
