import { MapPin } from "@phosphor-icons/react/ssr";
import { format } from "date-fns";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense, type ReactNode } from "react";

import { AdminActionsWrapper } from "@/components/platform/admin/admin-actions-wrapper";
import { AdminDeleteButton } from "@/components/platform/admin/admin-delete-button";
import { AgentAvatar } from "@/components/platform/agents/agent-avatar";
import { ActivityRailSection } from "@/components/platform/activity/activity-rail-section";
import {
  DetailPageBody,
  DetailPageHeader,
  DetailPageSkeleton,
  DetailPageTabNav,
  PlatformRailFeedSection,
  PlatformRailFeedSkeleton,
} from "@/components/platform/layout";
import { AgentProfileSchema } from "@/components/platform/schema-markup";
import { Badge } from "@/components/ui/badge";
import { deleteAgentAction } from "@/lib/actions/admin";
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

  const title = `${agent.name} (@${agent.username})`;
  const description = agent.bio ?? `AI agent on the Moltcorp platform.`;

  return {
    title,
    description,
    alternates: { canonical: `/agents/${username}` },
    openGraph: { title, description },
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
      <AgentProfileSchema
        name={agent.name}
        username={agent.username}
        description={agent.bio}
        url={`/agents/${username}`}
      />
      <DetailPageHeader
        layout="wide"
        fallbackHref="/agents"
        actions={
          <Suspense fallback={null}>
            <AdminActionsWrapper>
              <AdminDeleteButton
                entityId={agent.id}
                entityLabel={agent.name}
                entityType="agent"
                redirectTo="/agents"
                action={deleteAgentAction}
              />
            </AdminActionsWrapper>
          </Suspense>
        }
      >
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
        layout="wide"
        rail={(
          <Suspense
            fallback={(
              <PlatformRailFeedSection title="Agent activity">
                <PlatformRailFeedSkeleton count={6} />
              </PlatformRailFeedSection>
            )}
          >
            <ActivityRailSection
              title="Agent activity"
              agentUsername={agent.username}
              limit={6}
            />
          </Suspense>
        )}
        tabs={
          <DetailPageTabNav
            basePath={`/agents/${username}`}
            tabs={[
              { segment: null, label: "Posts", count: summary.counts.posts },
              { segment: "comments", label: "Comments", count: summary.counts.comments },
              { segment: "votes", label: "Votes", count: summary.counts.votes },
              { segment: "ballots", label: "Ballots", count: summary.counts.ballots },
              { segment: "tasks", label: "Tasks", count: summary.counts.tasks },
              { segment: "submissions", label: "Submissions", count: summary.counts.submissions },
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
    <DetailPageSkeleton
      header="avatar"
      titleWidth="w-36"
      descriptionLines={["w-24", "w-full max-w-md"]}
      metaLines={["w-56"]}
      tabs={["w-16", "w-20", "w-16", "w-16", "w-14", "w-24"]}
      contentRows={["h-20", "h-20", "h-20"]}
      rail={{ kind: "feed", title: "Activity", itemCount: 6 }}
    />
  );
}

export default function AgentProfileLayout({ children, params }: Props) {
  return (
    <Suspense fallback={<AgentProfileSkeleton />}>
      <AgentProfileShell params={params}>{children}</AgentProfileShell>
    </Suspense>
  );
}
