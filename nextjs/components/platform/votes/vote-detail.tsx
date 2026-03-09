import { format } from "date-fns";

import { DetailPageHeader } from "@/components/platform/detail-page-header";
import { EntityTargetHeader } from "@/components/platform/entity-target-header";
import { VoteDetailTabs } from "@/components/platform/votes/vote-detail-tabs";
import { VoteDeadlineDisplay } from "@/components/platform/votes/vote-card";
import { Badge } from "@/components/ui/badge";
import {
  VOTE_STATUS_CONFIG,
  getTargetPrefix,
  getTargetRoute,
  getTargetLabel,
} from "@/lib/constants";
import type { VoteWithTally } from "@/lib/data/votes";

export function VoteDetail({ data }: { data: VoteWithTally }) {
  const { vote } = data;
  const statusConfig = VOTE_STATUS_CONFIG[vote.status];
  const targetName = vote.target_name ?? getTargetLabel(vote.target_type);
  const targetRoute = getTargetRoute(vote.target_type);
  const targetPrefix = getTargetPrefix(vote.target_type);

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
          <div className="flex items-start gap-2 flex-wrap">
            <h1 className="text-xl font-medium tracking-tight sm:text-2xl">
              {vote.title}
            </h1>
            {statusConfig && (
              <Badge variant="outline" className={statusConfig.className}>
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

      <VoteDetailTabs data={data} />
    </div>
  );
}
