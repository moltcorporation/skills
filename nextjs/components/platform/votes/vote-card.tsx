import { formatDistanceToNow } from "date-fns";
import { Timer } from "@phosphor-icons/react";
import Link from "next/link";

import { AgentAvatar } from "@/components/platform/agent-avatar";
import { CardLinkOverlay } from "@/components/platform/card-link-overlay";
import {
  PlatformEntityCard,
  PlatformEntityCardContent,
  PlatformEntityCardHeader,
} from "@/components/platform/entity-card";
import { Badge } from "@/components/ui/badge";
import { CardTitle } from "@/components/ui/card";
import { Progress, ProgressLabel } from "@/components/ui/progress";
import { VOTE_STATUS_CONFIG } from "@/lib/constants";
import type { Vote, VoteStatus } from "@/lib/data/votes";

type VoteTallySummary = {
  yes: number;
  no: number;
  closesIn: string;
};

type VoteCardProps =
  | {
      vote: Vote;
      tally?: never;
    }
  | {
      vote: {
        id: string;
        title: string;
        status: VoteStatus | string;
        description?: string | null;
        author?: Vote["author"];
        deadline?: string;
      };
      tally: VoteTallySummary;
    };

export function VoteStatusBadge({
  status,
}: {
  status: VoteStatus | string;
}) {
  const config =
    typeof status === "string"
      ? VOTE_STATUS_CONFIG[status as VoteStatus]
      : VOTE_STATUS_CONFIG[status];

  if (!config) return <Badge variant="outline">{status}</Badge>;

  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
}

export function VoteDeadlineDisplay({
  deadline,
  status,
}: {
  deadline: string;
  status: string;
}) {
  const isExpired = new Date(deadline) < new Date();
  if (status === "closed" || isExpired) {
    return <span className="text-muted-foreground">Ended</span>;
  }

  return (
    <span className="inline-flex items-center gap-1 text-muted-foreground">
      <Timer className="size-3" />
      {formatDistanceToNow(new Date(deadline), { addSuffix: false })} left
    </span>
  );
}

export function VoteAuthorLink({ author }: { author: Vote["author"] }) {
  if (!author) return null;

  return (
    <Link
      href={`/agents/${author.username}`}
      className="relative z-10 inline-flex min-w-0 items-center gap-2 text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
    >
      <AgentAvatar
        name={author.name}
        username={author.username}
        size="sm"
      />
      <span className="truncate">{author.name}</span>
    </Link>
  );
}

export function VoteCard(props: VoteCardProps) {
  const { vote } = props;
  const href = `/votes/${vote.id}`;
  const tally = "tally" in props ? props.tally : null;

  return (
    <PlatformEntityCard>
      <PlatformEntityCardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="truncate">{vote.title}</CardTitle>
          <VoteStatusBadge status={vote.status} />
        </div>
      </PlatformEntityCardHeader>

      {vote.description ? (
        <PlatformEntityCardContent className="pb-0">
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {vote.description}
          </p>
        </PlatformEntityCardContent>
      ) : null}

      {tally ? (
        <PlatformEntityCardContent className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
            <span className="tabular-nums">
              Yes {tally.yes} / No {tally.no}
            </span>
            <span>closes in {tally.closesIn}</span>
          </div>
          <div className="rounded-sm border border-border p-3">
            <Progress
              value={
                tally.yes + tally.no === 0
                  ? 0
                  : (tally.yes / (tally.yes + tally.no)) * 100
              }
              className="gap-2"
            >
              <div className="flex items-center justify-between gap-3">
                <ProgressLabel className="text-[0.625rem] text-muted-foreground">
                  Approval
                </ProgressLabel>
                <span className="text-[0.7rem] text-foreground">
                  {Math.round(
                    tally.yes + tally.no === 0
                      ? 0
                      : (tally.yes / (tally.yes + tally.no)) * 100,
                  )}%
                </span>
              </div>
            </Progress>
          </div>
        </PlatformEntityCardContent>
      ) : (
        <PlatformEntityCardContent>
          <div className="flex items-center gap-2 text-sm">
            {vote.author ? (
              <>
                <VoteAuthorLink author={vote.author} />
                <span className="text-muted-foreground" aria-hidden>
                  &middot;
                </span>
              </>
            ) : null}
            {vote.deadline ? (
              <VoteDeadlineDisplay
                deadline={vote.deadline}
                status={vote.status}
              />
            ) : null}
          </div>
        </PlatformEntityCardContent>
      )}

      <CardLinkOverlay href={href} label={`View ${vote.title}`} />
    </PlatformEntityCard>
  );
}
