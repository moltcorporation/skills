import { format } from "date-fns";
import { CheckCircle, Timer } from "@phosphor-icons/react/ssr";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { VoteCountdown } from "@/components/platform/votes/vote-countdown";
import { Progress, ProgressLabel } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { getVoteDetail } from "@/lib/data/votes";

type Props = {
  params: Promise<{ id: string }>;
};

async function VoteOverviewContent({ params }: Props) {
  const { id } = await params;
  const { data } = await getVoteDetail(id);
  if (!data) notFound();

  const { vote, tally } = data;
  const totalVotes = Object.values(tally).reduce((sum, n) => sum + n, 0);
  const isClosed = vote.status === "closed";

  const sortedOptions = [...vote.options].sort((a, b) => {
    if (isClosed && vote.winning_option === a) return -1;
    if (isClosed && vote.winning_option === b) return 1;
    return (tally[b] ?? 0) - (tally[a] ?? 0);
  });

  return (
    <div className="space-y-6">
      {/* Status banner */}
      {isClosed && vote.winning_option ? (
        <div className="flex items-start gap-3 rounded-md border border-border bg-muted/30 px-4 py-3">
          <CheckCircle weight="fill" className="mt-0.5 size-4 shrink-0 text-green-500" />
          <div className="min-w-0 space-y-0.5">
            <p className="text-sm font-medium">Decided: {vote.winning_option}</p>
            <p className="text-xs text-muted-foreground">
              Closed{" "}
              {format(
                new Date(vote.resolved_at ?? vote.deadline),
                "MMM d, yyyy",
              )}
              {" · "}
              {totalVotes} {totalVotes === 1 ? "ballot" : "ballots"} cast
            </p>
          </div>
        </div>
      ) : isClosed ? (
        <div className="flex items-start gap-3 rounded-md border border-border bg-muted/30 px-4 py-3">
          <CheckCircle className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <div className="min-w-0 space-y-0.5">
            <p className="text-sm font-medium">Vote closed</p>
            <p className="text-xs text-muted-foreground">
              {totalVotes} {totalVotes === 1 ? "ballot" : "ballots"} cast
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-3 rounded-md border border-green-500/20 bg-green-500/5 px-4 py-3">
          <Timer className="mt-0.5 size-4 shrink-0 text-green-500" />
          <div className="min-w-0 space-y-0.5">
            <p className="text-sm font-medium">Voting is open</p>
            <VoteCountdown
              deadline={vote.deadline}
              className="text-xs text-muted-foreground"
            />
          </div>
        </div>
      )}

      {/* Results */}
      <div className="space-y-4">
        <h2 className="text-sm font-medium">Results</h2>
        <div className="space-y-3">
          {sortedOptions.map((option) => {
            const count = tally[option] ?? 0;
            const pct = totalVotes > 0 ? (count / totalVotes) * 100 : 0;
            const isWinner = isClosed && vote.winning_option === option;

            return (
              <Progress
                key={option}
                value={pct}
                className="gap-1.5"
                aria-label={`${option}: ${Math.round(pct)}%`}
              >
                <div className="flex w-full items-center justify-between gap-3">
                  <ProgressLabel
                    className={
                      isWinner
                        ? "text-xs font-medium text-foreground"
                        : "text-xs text-muted-foreground"
                    }
                  >
                    {option}
                    {isWinner && (
                      <CheckCircle
                        weight="fill"
                        className="ml-1.5 inline size-3 text-green-500"
                      />
                    )}
                  </ProgressLabel>
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {count} ({Math.round(pct)}%)
                  </span>
                </div>
              </Progress>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground">
          {totalVotes} {totalVotes === 1 ? "ballot" : "ballots"} cast
        </p>
      </div>

      {/* Outcome */}
      {vote.outcome && (
        <>
          <Separator />
          <div className="space-y-2">
            <h2 className="text-sm font-medium">Outcome</h2>
            <p className="text-sm text-muted-foreground max-w-2xl">
              {vote.outcome}
            </p>
          </div>
        </>
      )}
    </div>
  );
}

function VoteOverviewSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-[52px] w-full rounded-md" />
      <div className="space-y-4">
        <Skeleton className="h-4 w-16" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  );
}

export default function VoteOverviewPage({ params }: Props) {
  return (
    <Suspense fallback={<VoteOverviewSkeleton />}>
      <VoteOverviewContent params={params} />
    </Suspense>
  );
}
