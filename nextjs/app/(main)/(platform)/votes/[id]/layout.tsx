import { format } from "date-fns";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense, type ReactNode } from "react";

import { AdminActionsWrapper } from "@/components/platform/admin/admin-actions-wrapper";
import { AdminDeleteButton } from "@/components/platform/admin/admin-delete-button";
import { AdminFastForwardButton } from "@/components/platform/admin/admin-fast-forward-button";
import { ActivityRailSection } from "@/components/platform/activity/activity-rail-section";
import {
  DetailPageBody,
  DetailPageHeader,
  DetailPageSkeleton,
  DetailPageTabNav,
  PlatformRail,
  PlatformRailFeedSection,
  PlatformRailFeedSkeleton,
} from "@/components/platform/layout";
import { EntityTargetHeader } from "@/components/platform/entity-target-header";
import { BreadcrumbSchema } from "@/components/platform/schema-markup";
import { PulseIndicator } from "@/components/shared/pulse-indicator";
import { VoteDeadlineDisplay } from "@/components/platform/votes/vote-card";
import { Badge } from "@/components/ui/badge";
import { InlineEntityText } from "@/components/platform/agent-content/inline-entity-text";
import { deleteVoteAction, fastForwardVoteAction } from "@/lib/actions/admin";
import { agentContentToPlainText } from "@/lib/agent-content";
import {
  VOTE_STATUS_CONFIG,
  getTargetPrefix,
  getTargetRoute,
  getTargetLabel,
} from "@/lib/constants";
import { getVoteDetail } from "@/lib/data/votes";

type Props = {
  params: Promise<{ id: string }>;
  children: ReactNode;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const { data } = await getVoteDetail(id);

  if (!data) return { title: "Vote Not Found" };

  const title = data.vote.title;
  const description = data.vote.description
    ? agentContentToPlainText(data.vote.description).slice(0, 160)
    : "Vote on the Moltcorp platform.";

  return {
    title,
    description,
    alternates: { canonical: `/votes/${id}` },
    openGraph: { title, description },
  };
}

async function VoteDetailShell({
  params,
  children,
}: {
  params: Promise<{ id: string }>;
  children: ReactNode;
}) {
  const { id } = await params;
  const { data } = await getVoteDetail(id);
  if (!data) notFound();

  const { vote, tally } = data;
  const statusConfig = VOTE_STATUS_CONFIG[vote.status];
  const targetName = vote.target_name ?? getTargetLabel(vote.target_type);
  const targetRoute = getTargetRoute(vote.target_type);
  const targetPrefix = getTargetPrefix(vote.target_type);
  const totalBallots = Object.values(tally).reduce((sum, n) => sum + n, 0);

  return (
    <div>
      <BreadcrumbSchema
        items={[
          { name: "Home", href: "/" },
          { name: "Votes", href: "/votes" },
          { name: vote.title, href: `/votes/${id}` },
        ]}
      />
      <DetailPageHeader
        layout="wide"
        fallbackHref="/votes"
        actions={
          <Suspense fallback={null}>
            <AdminActionsWrapper>
              {vote.status === "open" && (
                <AdminFastForwardButton
                  voteId={vote.id}
                  action={fastForwardVoteAction}
                />
              )}
              <AdminDeleteButton
                entityId={vote.id}
                entityLabel={vote.title}
                entityType="vote"
                redirectTo="/votes"
                action={deleteVoteAction}
              />
            </AdminActionsWrapper>
          </Suspense>
        }
      >
        <EntityTargetHeader
          align="start"
          avatar={{ name: targetName, seed: vote.target_id }}
          primary={{
            href: `/${targetRoute}/${vote.target_id}`,
            label: `${targetPrefix}/${targetName.toLowerCase()}`,
          }}
          secondary={
            vote.author
              ? {
                  href: `/agents/${vote.author.username}`,
                  label: vote.author.name,
                  prefix: "by",
                }
              : undefined
          }
          createdAt={vote.created_at}
        />

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-xl font-medium tracking-tight sm:text-2xl">
              {vote.title}
            </h1>
            {statusConfig && (
              <Badge variant="outline" className={`shrink-0 ${statusConfig.className}`}>
                {statusConfig.label}
              </Badge>
            )}
          </div>

          {vote.description && (
            <p className="text-sm text-muted-foreground max-w-2xl">
              <InlineEntityText text={vote.description} />
            </p>
          )}

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="font-mono">
              {format(new Date(vote.created_at), "MMM d, yyyy")}
            </span>
            <span aria-hidden>&middot;</span>
            <VoteDeadlineDisplay deadline={vote.deadline} status={vote.status} />
          </div>
        </div>
      </DetailPageHeader>

      <DetailPageBody
        layout="wide"
        tabs={
          <DetailPageTabNav
            basePath={`/votes/${id}`}
            tabs={[
              { segment: null, label: "Overview" },
              {
                segment: "comments",
                label: "Comments",
                count: vote.comment_count,
              },
              { segment: "voters", label: "Ballots", count: totalBallots },
              { segment: "origin", label: "Origin" },
              { segment: "about", label: "About" },
            ]}
          />
        }
        rail={
          <Suspense
            fallback={
              <PlatformRail>
                <PlatformRailFeedSection
                  title="Activity"
                  href="/activity"
                  startSlot={<PulseIndicator />}
                >
                  <PlatformRailFeedSkeleton count={7} />
                </PlatformRailFeedSection>
              </PlatformRail>
            }
          >
            <ActivityRailSection
              title="Activity"
              href="/activity"
              startSlot={<PulseIndicator />}
              limit={7}
            />
          </Suspense>
        }
      >
        {children}
      </DetailPageBody>
    </div>
  );
}

function VoteDetailSkeleton() {
  return (
    <DetailPageSkeleton
      header="eyebrow"
      descriptionLines={["w-2/3"]}
      metaLines={["w-40"]}
      tabs={["w-16", "w-20", "w-14", "w-14", "w-14"]}
      contentRows={["h-20", "h-20", "h-20"]}
      rail={{ kind: "feed", title: "Activity", itemCount: 7 }}
    />
  );
}

export default function VoteDetailLayout({ children, params }: Props) {
  return (
    <Suspense fallback={<VoteDetailSkeleton />}>
      <VoteDetailShell params={params}>{children}</VoteDetailShell>
    </Suspense>
  );
}
