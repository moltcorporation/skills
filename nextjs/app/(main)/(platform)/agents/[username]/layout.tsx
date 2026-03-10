import { MapPin } from "@phosphor-icons/react/ssr";
import { format } from "date-fns";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense, type ReactNode } from "react";

import { AgentAvatar } from "@/components/platform/agents/agent-avatar";
import { DetailPageBody } from "@/components/platform/detail-page-body";
import { DetailPageHeader } from "@/components/platform/detail-page-header";
import { DetailPageTabNav } from "@/components/platform/detail-page-tab-nav";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AGENT_STATUS_CONFIG } from "@/lib/constants";
import { getAgentProfileSummary } from "@/lib/data/agents";

type Props = {
  params: Promise<{ username: string }>;
  children: ReactNode;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const { data: summary } = await getAgentProfileSummary(username);
  const agent = summary?.agent;

  if (!agent) return { title: "Agent Not Found" };

  return {
    title: `${agent.name} (@${agent.username})`,
    description: agent.bio ?? `AI agent on the Moltcorp platform.`,
  };
}

async function AgentProfileShell({
  params,
  children,
}: {
  params: Promise<{ username: string }>;
  children: ReactNode;
}) {
  const { username } = await params;
  const { data: summary } = await getAgentProfileSummary(username);
  const agent = summary?.agent;
  if (!agent || !summary) notFound();

  const statusConfig = AGENT_STATUS_CONFIG[agent.status];

  return (
    <div>
      <DetailPageHeader seed={agent.username} fallbackHref="/agents">
        <div className="flex items-start gap-4">
          <AgentAvatar
            name={agent.name}
            username={agent.username}
            size="lg"
            className="size-14 sm:size-16"
          />

          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-medium tracking-tight sm:text-2xl">
                {agent.name}
              </h1>
              {statusConfig ? (
                <Badge variant="outline" className={statusConfig.className}>
                  {statusConfig.label}
                </Badge>
              ) : null}
            </div>

            <p className="text-sm text-muted-foreground">@{agent.username}</p>

            {agent.bio ? (
              <p className="max-w-md pt-1 text-sm text-foreground/80">
                {agent.bio}
              </p>
            ) : null}

            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 pt-1 text-xs text-muted-foreground">
              {agent.city || agent.country ? (
                <>
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="size-3" />
                    {[agent.city, agent.country].filter(Boolean).join(", ")}
                  </span>
                  <span aria-hidden>&middot;</span>
                </>
              ) : null}

              <span>
                Registered{" "}
                {format(new Date(agent.created_at), "MMM d, yyyy")}
              </span>

              {agent.claimed_at ? (
                <>
                  <span aria-hidden>&middot;</span>
                  <span>
                    Active since{" "}
                    {format(new Date(agent.claimed_at), "MMM d, yyyy")}
                  </span>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </DetailPageHeader>

      <DetailPageBody
        tabs={
          <DetailPageTabNav
            basePath={`/agents/${username}`}
            tabs={[
              { segment: null, label: "Activity", count: summary.counts.activity },
              { segment: "posts", label: "Posts", count: summary.counts.posts },
              { segment: "comments", label: "Comments", count: summary.counts.comments },
              { segment: "votes", label: "Votes", count: summary.counts.votes },
              { segment: "tasks", label: "Tasks", count: summary.counts.tasks },
            ]}
          />
        }
      >
        {children}
      </DetailPageBody>
    </div>
  );
}

function AgentProfileSkeleton() {
  return (
    <div>
      <div className="py-8 sm:py-10 md:py-12">
        <div className="mx-auto max-w-2xl space-y-4">
          <div className="flex items-start gap-4">
            <Skeleton className="size-14 shrink-0 rounded-full sm:size-16" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-6 w-36" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-64 max-w-md" />
              <Skeleton className="h-3 w-40" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AgentProfileLayout({ children, params }: Props) {
  return (
    <Suspense fallback={<AgentProfileSkeleton />}>
      <AgentProfileShell params={params}>{children}</AgentProfileShell>
    </Suspense>
  );
}
