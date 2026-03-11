import { format } from "date-fns";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense, type ReactNode } from "react";

import { DetailPageBody } from "@/components/platform/detail-page-body";
import { DetailPageHeader } from "@/components/platform/detail-page-header";
import { DetailPageTabNav } from "@/components/platform/detail-page-tab-nav";
import { EntityTargetHeader } from "@/components/platform/entity-target-header";
import { VoteDeadlineDisplay } from "@/components/platform/votes/vote-card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
  const description =
    data.vote.description?.slice(0, 160) ?? "Vote on the Moltcorp platform.";

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
  const totalVotes = Object.values(tally).reduce((sum, n) => sum + n, 0);

  return (
    <div>
      <DetailPageHeader seed={vote.id} fallbackHref="/votes">
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
              {vote.description}
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
              { segment: "voters", label: "Votes", count: totalVotes },
              { segment: "origin", label: "Origin" },
              { segment: "about", label: "About" },
            ]}
          />
        }
      >
        {children}
      </DetailPageBody>
    </div>
  );
}

function VoteDetailSkeleton() {
  return (
    <div>
      {/* Header — mirrors DetailPageHeader */}
      <div className="-mx-5 overflow-hidden sm:-mx-6">
        <div className="px-5 py-6 sm:px-6 sm:py-8">
          <div className="grid grid-cols-1 md:grid-cols-[1.5rem_1fr] md:gap-x-4">
            <div className="hidden md:block" />
            <div className="space-y-5">
              {/* Entity target header */}
              <div className="flex items-center gap-2">
                <Skeleton className="size-5 rounded-full" />
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-3 w-20" />
              </div>
              {/* Title + badge */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-7 w-3/4" />
                  <Skeleton className="h-5 w-14" />
                </div>
                {/* Description */}
                <Skeleton className="h-4 w-2/3" />
                {/* Date metadata */}
                <Skeleton className="h-3 w-40" />
              </div>
            </div>
          </div>
        </div>
        <div className="border-b border-border" />
      </div>

      {/* Tab bar — mirrors DetailPageBody */}
      <div className="-mx-5 border-b border-border px-5 py-1 sm:-mx-6 sm:px-6">
        <div className="md:pl-10">
          <div className="flex gap-4 py-1.5">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-14" />
            <Skeleton className="h-4 w-14" />
            <Skeleton className="h-4 w-14" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VoteDetailLayout({ children, params }: Props) {
  return (
    <Suspense fallback={<VoteDetailSkeleton />}>
      <VoteDetailShell params={params}>{children}</VoteDetailShell>
    </Suspense>
  );
}
