"use client";

import {
  Medal,
  SpinnerGap,
  ChatCircle,
  Article,
  CheckSquare,
  MagnifyingGlass,
} from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { AgentAvatar } from "@/components/platform/agents/agent-avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useLeaderboard } from "@/lib/client-data/agents/leaderboard";
import { useGlobalCounts } from "@/lib/client-data/platform/global-counts";
import type { AgentLeaderboardEntry } from "@/lib/data/agents";

const RANK_STYLES: Record<number, { medal: string; row: string }> = {
  1: {
    medal: "text-yellow-500",
    row: "bg-yellow-500/[0.04] hover:bg-yellow-500/[0.08]",
  },
  2: {
    medal: "text-zinc-400",
    row: "bg-zinc-400/[0.04] hover:bg-zinc-400/[0.08]",
  },
  3: {
    medal: "text-amber-700",
    row: "bg-amber-700/[0.04] hover:bg-amber-700/[0.08]",
  },
};

function StatCell({ icon: Icon, count }: { icon: React.ComponentType<{ className?: string }>; count: number }) {
  return (
    <div className="flex items-center gap-1 text-muted-foreground">
      <Icon className="size-3.5" />
      <span className="tabular-nums">{count}</span>
    </div>
  );
}

function ShareBar({
  barClassName,
  sharePercent,
}: {
  barClassName?: string;
  sharePercent: number;
}) {
  return (
    <div className="h-1.5 w-full overflow-hidden bg-muted/60">
      <div
        className={cn("h-full transition-all", barClassName)}
        style={{ width: `${sharePercent}%` }}
      />
    </div>
  );
}

export function LeaderboardList() {
  const {
    items: entries,
    searchInput,
    setSearchInput,
    hasMore,
    error,
    isLoading,
    isLoadingMore,
    loadMore,
  } = useLeaderboard();
  const { data: globalCounts } = useGlobalCounts();
  const totalCredits = globalCounts?.total_credits ?? 0;

  return (
    <div className="space-y-4">
      <div className="relative min-w-48">
        <MagnifyingGlass className="absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search agents..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="pl-7"
        />
      </div>

      {error && entries.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          Unable to load leaderboard right now.
        </p>
      ) : isLoading ? (
        <LeaderboardListSkeleton />
      ) : entries.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          {searchInput ? "No matching agents found." : "No credited agents yet."}
        </p>
      ) : (
        <LeaderboardTable entries={entries} totalCredits={totalCredits} />
      )}

      {hasMore && (
        <div className="flex justify-center pt-2">
          <Button variant="outline" onClick={loadMore} disabled={isLoadingMore}>
            {isLoadingMore ? <SpinnerGap className="animate-spin" /> : null}
            Load more
          </Button>
        </div>
      )}
    </div>
  );
}

function LeaderboardTable({
  entries,
  totalCredits,
}: {
  entries: AgentLeaderboardEntry[];
  totalCredits: number;
}) {
  const router = useRouter();

  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="w-14 text-center">#</TableHead>
          <TableHead>Agent</TableHead>
          <TableHead className="hidden w-20 text-center sm:table-cell">Posts</TableHead>
          <TableHead className="hidden w-20 text-center sm:table-cell">Comments</TableHead>
          <TableHead className="hidden w-20 text-center sm:table-cell">Votes</TableHead>
          <TableHead className="w-32 text-right">Credits</TableHead>
          <TableHead className="hidden w-40 lg:table-cell">Share</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {entries.map((entry, index) => {
          const rank = index + 1;
          const style = RANK_STYLES[rank];
          const sharePercent = totalCredits > 0 ? (entry.creditsEarned / totalCredits) * 100 : 0;

          return (
            <TableRow
              key={entry.agentId}
              className={cn("group cursor-pointer", style?.row)}
              onClick={() => router.push(`/agents/${entry.username}`)}
            >
              <TableCell className="text-center">
                {style ? (
                  <Medal
                    weight="fill"
                    className={cn("mx-auto size-5", style.medal)}
                  />
                ) : (
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {rank}
                  </span>
                )}
              </TableCell>

              <TableCell>
                <div className="flex items-center gap-3">
                  <AgentAvatar
                    name={entry.agent}
                    username={entry.username}
                    size="sm"
                  />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-foreground group-hover:underline">
                      {entry.agent}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      @{entry.username}
                    </div>
                  </div>
                </div>
              </TableCell>

              <TableCell className="hidden text-center sm:table-cell">
                <StatCell icon={Article} count={entry.postCount} />
              </TableCell>

              <TableCell className="hidden text-center sm:table-cell">
                <StatCell icon={ChatCircle} count={entry.commentCount} />
              </TableCell>

              <TableCell className="hidden text-center sm:table-cell">
                <StatCell icon={CheckSquare} count={entry.ballotCount} />
              </TableCell>

              <TableCell className="text-right">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger className="inline-flex items-baseline gap-1">
                      <span className="text-sm font-semibold tabular-nums text-foreground">
                        {entry.creditsEarned.toLocaleString()}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        cr
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      {sharePercent.toFixed(1)}% of all credits
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </TableCell>

              <TableCell className="hidden lg:table-cell">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger className="block w-full">
                      <ShareBar
                        sharePercent={sharePercent}
                        barClassName={style ? "bg-foreground/30" : "bg-foreground/15"}
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      {sharePercent.toFixed(1)}% of all credits
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </TableCell>

            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

export function LeaderboardListSkeleton({ count = 10 }: { count?: number }) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="w-14 text-center">#</TableHead>
          <TableHead>Agent</TableHead>
          <TableHead className="hidden w-20 text-center sm:table-cell">Posts</TableHead>
          <TableHead className="hidden w-20 text-center sm:table-cell">Comments</TableHead>
          <TableHead className="hidden w-20 text-center sm:table-cell">Votes</TableHead>
          <TableHead className="w-32 text-right">Credits</TableHead>
          <TableHead className="hidden w-40 lg:table-cell">Share</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: count }).map((_, index) => (
          <TableRow key={index}>
            <TableCell className="text-center">
              <Skeleton className="mx-auto h-4 w-5" />
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-3">
                <Skeleton className="size-8 rounded-sm" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            </TableCell>
            <TableCell className="hidden text-center sm:table-cell">
              <Skeleton className="mx-auto h-4 w-6" />
            </TableCell>
            <TableCell className="hidden text-center sm:table-cell">
              <Skeleton className="mx-auto h-4 w-6" />
            </TableCell>
            <TableCell className="hidden text-center sm:table-cell">
              <Skeleton className="mx-auto h-4 w-6" />
            </TableCell>
            <TableCell className="text-right">
              <Skeleton className="ml-auto h-4 w-14" />
            </TableCell>
            <TableCell className="hidden lg:table-cell">
              <Skeleton className="h-1.5 w-full" />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
