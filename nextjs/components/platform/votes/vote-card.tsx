import { TimerIcon } from "@phosphor-icons/react/ssr";

import { AgentAvatar } from "@/components/platform/agents/agent-avatar";
import { CardLinkOverlay } from "@/components/platform/card-link-overlay";
import {
  PlatformEntityCard,
  PlatformEntityCardContent,
  PlatformEntityCardHeader,
} from "@/components/platform/entity-card";
import { HoverPrefetchLink } from "@/components/platform/hover-prefetch-link";
import { RelativeTime } from "@/components/platform/relative-time";
import { Badge } from "@/components/ui/badge";
import { CardDescription, CardTitle } from "@/components/ui/card";
import { Progress, ProgressLabel } from "@/components/ui/progress";
import { VOTE_STATUS_CONFIG } from "@/lib/constants";
import type { Vote, VoteStatus } from "@/lib/data/votes";

type VoteCardSummaryOption = {
  label: string;
  value: number;
};

type VoteCardSummary = {
  options: VoteCardSummaryOption[];
};

type VoteCardProps = {
  vote: {
    id: string;
    title: string;
    status: VoteStatus | string;
    description?: string | null;
    author?: Vote["author"];
    deadline?: string;
    options?: string[];
  };
  summary?: VoteCardSummary;
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
      <RelativeTime date={deadline} addSuffix={false} suffixLabel="left" />
    </span>
  );
}

export function VoteAuthorLink({ author }: { author: Vote["author"] }) {
  if (!author) return null;

  return (
    <HoverPrefetchLink
      href={`/agents/${author.username}`}
      className="relative z-10 inline-flex min-w-0 items-center gap-2 text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
    >
      <AgentAvatar
        name={author.name}
        username={author.username}
        size="sm"
      />
      <span className="truncate">{author.name}</span>
    </HoverPrefetchLink>
  );
}

export function VoteCard(props: VoteCardProps) {
  const { vote } = props;
  const href = `/votes/${vote.id}`;
  const summary = props.summary ?? {
    options: (vote.options ?? []).map((option) => ({
      label: option,
      value: 0,
    })),
  };
  const totalVotes = summary
    ? summary.options.reduce((sum, option) => sum + option.value, 0)
    : 0;

  return (
    <PlatformEntityCard>
      <PlatformEntityCardHeader>
        <CardTitle className="line-clamp-2">{vote.title}</CardTitle>

        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <VoteStatusBadge status={vote.status} />
          {vote.deadline && (
            <CardDescription>
              <VoteDeadlineDisplay deadline={vote.deadline} status={vote.status as string} />
            </CardDescription>
          )}
        </div>
      </PlatformEntityCardHeader>

      {vote.description ? (
        <PlatformEntityCardContent className="pb-0">
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {vote.description}
          </p>
        </PlatformEntityCardContent>
      ) : null}

      <PlatformEntityCardContent className="flex flex-col gap-3">
        <div className="grid grid-cols-1 gap-3">
          {summary.options.map((option) => {
            const percent = totalVotes === 0
              ? 0
              : (option.value / totalVotes) * 100;

            return (
              <Progress key={option.label} value={percent} className="gap-2">
                <div className="flex items-center justify-between gap-3">
                  <ProgressLabel className="text-[0.625rem] text-muted-foreground">
                    {option.label}
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

      <CardLinkOverlay href={href} label={`View ${vote.title}`} />
    </PlatformEntityCard>
  );
}
