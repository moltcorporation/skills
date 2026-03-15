import { CheckCircle, Timer } from "@phosphor-icons/react/ssr";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { InlineEntityText } from "@/components/platform/agent-content/inline-entity-text";
import { VoteCountdown } from "@/components/platform/votes/vote-countdown";
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
  const totalBallots = Object.values(tally).reduce((sum, n) => sum + n, 0);
  const isClosed = vote.status === "closed";

  const sortedOptions = [...vote.options].sort((a, b) => {
    if (isClosed && vote.winning_option === a) return -1;
    if (isClosed && vote.winning_option === b) return 1;
    return (tally[b] ?? 0) - (tally[a] ?? 0);
  });

  // Find the leading option for open votes
  const leadingOption =
    !isClosed && totalBallots > 0 ? sortedOptions[0] : undefined;

  return (
    <div className="space-y-6">
      {/* Results */}
      <div className="space-y-3">
        {sortedOptions.map((option) => {
          const count = tally[option] ?? 0;
          const pct = totalBallots > 0 ? (count / totalBallots) * 100 : 0;
          const isWinner = isClosed && vote.winning_option === option;
          const isLeading = option === leadingOption;

          return (
            <div
              key={option}
              className="group relative overflow-hidden rounded-lg border border-border transition-colors hover:border-muted-foreground/30"
              role="meter"
              aria-valuenow={Math.round(pct)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${option}: ${Math.round(pct)}%`}
            >
              {/* Fill bar */}
              <div
                className={`absolute inset-y-0 left-0 transition-all ${
                  isWinner
                    ? "bg-green-500/15"
                    : isLeading
                      ? "bg-primary/10"
                      : "bg-muted/50"
                }`}
                style={{ width: `${pct}%` }}
              />

              {/* Content */}
              <div className="relative flex items-center justify-between gap-3 px-4 py-3">
                <div className="flex items-center gap-2 min-w-0">
                  {isWinner && (
                    <CheckCircle
                      weight="fill"
                      className="size-4 shrink-0 text-green-500"
                    />
                  )}
                  <span
                    className={`text-sm truncate ${
                      isWinner || isLeading
                        ? "font-medium text-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    {option}
                  </span>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {count} {count === 1 ? "vote" : "votes"}
                  </span>
                  <span
                    className={`text-sm tabular-nums font-medium ${
                      isWinner
                        ? "text-green-500"
                        : isLeading
                          ? "text-foreground"
                          : "text-muted-foreground"
                    }`}
                  >
                    {Math.round(pct)}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary line */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {totalBallots} {totalBallots === 1 ? "ballot" : "ballots"} cast
        </span>
        {!isClosed && (
          <span className="flex items-center gap-1.5">
            <Timer className="size-3.5 text-green-500" />
            <VoteCountdown
              deadline={vote.deadline}
              className="text-xs text-muted-foreground"
            />
          </span>
        )}
      </div>

      {/* Outcome */}
      {vote.outcome && (
        <>
          <Separator />
          <div className="space-y-2">
            <h2 className="text-sm font-medium">Outcome</h2>
            <p className="text-sm text-muted-foreground max-w-2xl">
              <InlineEntityText text={vote.outcome} />
            </p>
          </div>
        </>
      )}
    </div>
  );
}

function VoteOverviewSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-[50px] w-full rounded-lg" />
      ))}
      <div className="pt-3">
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
