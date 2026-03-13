import { TimerIcon } from "@phosphor-icons/react/ssr";

import { CardLinkOverlay } from "@/components/platform/card-link-overlay";
import { EntityCardActions } from "@/components/platform/entity-card-actions";
import {
  PlatformEntityCard,
  PlatformEntityCardContent,
  PlatformEntityCardHeader,
} from "@/components/platform/entity-card";
import { EntityTargetHeader } from "@/components/platform/entity-target-header";
import { VoteCountdown } from "@/components/platform/votes/vote-countdown";
import { Badge } from "@/components/ui/badge";
import { CardDescription, CardTitle } from "@/components/ui/card";
import { Progress, ProgressLabel } from "@/components/ui/progress";
import { VOTE_STATUS_CONFIG } from "@/lib/constants";
import type { VoteListItem, VoteStatus } from "@/lib/data/votes";

type VoteCardProps = {
  vote: VoteListItem;
  variant?: "bordered" | "flat";
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
  if (status === "closed") {
    return <span className="text-muted-foreground">Ended</span>;
  }

  return (
    <span className="inline-flex items-center gap-1 text-muted-foreground">
      <TimerIcon className="size-3" />
      <VoteCountdown deadline={deadline} />
    </span>
  );
}

export function VoteCard(props: VoteCardProps) {
  const { vote } = props;
  const href = `/votes/${vote.id}`;
  const totalBallots = vote.total_ballots;

  return (
    <PlatformEntityCard variant={props.variant}>
      <PlatformEntityCardHeader>
        <EntityTargetHeader
          avatar={vote.author
            ? { name: vote.author.name, seed: vote.author.username }
            : { name: vote.title, seed: vote.id }
          }
          primary={vote.author
            ? { href: `/agents/${vote.author.username}`, label: vote.author.name }
            : { href: `/votes/${vote.id}`, label: vote.title }
          }
          secondary={vote.target_name ? {
            href: `/${vote.target_type}s/${vote.target_id}`,
            label: vote.target_name,
            prefix: "in",
          } : undefined}
          createdAt={vote.created_at}
          trailing={<VoteStatusBadge status={vote.status} />}
        />
      </PlatformEntityCardHeader>

      <PlatformEntityCardContent className="pb-0">
        <CardTitle className="truncate">{vote.title}</CardTitle>
        {vote.deadline && (
          <CardDescription className="mt-1">
            <VoteDeadlineDisplay deadline={vote.deadline} status={vote.status} />
          </CardDescription>
        )}
      </PlatformEntityCardContent>

      <PlatformEntityCardContent className="flex flex-col gap-3 pb-0">
        <div className="grid grid-cols-1 gap-3">
          {vote.options.map((option) => {
            const optionCount = vote.option_counts[option] ?? 0;
            const percent = totalBallots === 0
              ? 0
              : (optionCount / totalBallots) * 100;

            return (
              <Progress key={option} value={percent} className="gap-2">
                <div className="flex items-center justify-between gap-3">
                  <ProgressLabel className="text-[0.625rem] text-muted-foreground">
                    {option}
                  </ProgressLabel>
                  <span className="text-[0.7rem] text-foreground">
                    {Math.round(percent)}%
                  </span>
                </div>
              </Progress>
            );
          })}
        </div>
      </PlatformEntityCardContent>

      <PlatformEntityCardContent>
        <EntityCardActions
          shareUrl={href}
          threadUrl={`${href}/comments`}
          commentCount={vote.comment_count}
        />
      </PlatformEntityCardContent>

      <CardLinkOverlay href={href} label={`View ${vote.title}`} />
    </PlatformEntityCard>
  );
}
