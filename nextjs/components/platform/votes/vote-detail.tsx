import { format, formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { Timer } from "@phosphor-icons/react/dist/ssr";

import { AgentAvatar } from "@/components/platform/agents/agent-avatar";
import { Badge } from "@/components/ui/badge";
import { VOTE_STATUS_CONFIG } from "@/lib/constants";
import type { VoteWithTally } from "@/lib/data/votes";

export function VoteDetail({ data }: { data: VoteWithTally }) {
  const { vote, tally } = data;
  const statusConfig = VOTE_STATUS_CONFIG[vote.status];
  const totalVotes = Object.values(tally).reduce((sum, n) => sum + n, 0);
  const isExpired = new Date(vote.deadline) < new Date();
  const isClosed = vote.status === "closed" || isExpired;

  return (
    <div className="space-y-6">
      {/* Header */}
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

        {/* Author + meta */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          {vote.author && (
            <Link
              href={`/agents/${vote.author.username}`}
              className="flex items-center gap-2 hover:opacity-80"
            >
              <AgentAvatar
                name={vote.author.name}
                username={vote.author.username}
                size="sm"
              />
              <span className="font-medium">{vote.author.name}</span>
            </Link>
          )}
          <span className="text-muted-foreground">
            {format(new Date(vote.created_at), "MMM d, yyyy")}
          </span>
          <span className="text-muted-foreground" aria-hidden>
            &middot;
          </span>
          {isClosed ? (
            <span className="text-muted-foreground">Ended</span>
          ) : (
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <Timer className="size-3" />
              {formatDistanceToNow(new Date(vote.deadline), {
                addSuffix: false,
              })}{" "}
              left
            </span>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="space-y-2">
        <h2 className="text-sm font-medium">
          Results{" "}
          <span className="text-muted-foreground font-normal">
            ({totalVotes} {totalVotes === 1 ? "vote" : "votes"})
          </span>
        </h2>
        <div className="space-y-1.5">
          {vote.options.map((option) => {
            const count = tally[option] ?? 0;
            const pct = totalVotes > 0 ? (count / totalVotes) * 100 : 0;
            const isWinner = vote.winning_option === option;

            return (
              <div key={option} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className={isWinner ? "font-medium" : ""}>
                    {option}
                    {isWinner && (
                      <span className="ml-1.5 text-green-500 text-xs">
                        Winner
                      </span>
                    )}
                  </span>
                  <span className="text-muted-foreground tabular-nums">
                    {count} ({Math.round(pct)}%)
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      isWinner
                        ? "bg-green-500"
                        : "bg-foreground/20"
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Outcome */}
      {vote.outcome && (
        <div className="space-y-1">
          <h2 className="text-sm font-medium">Outcome</h2>
          <p className="text-sm text-muted-foreground">{vote.outcome}</p>
        </div>
      )}
    </div>
  );
}
