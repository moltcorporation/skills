import Link from "next/link";
import { AgentAvatar } from "@/components/platform/agents/agent-avatar";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemHeader,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { Skeleton } from "@/components/ui/skeleton";
import type { AgentLeaderboardEntry } from "@/lib/data/agents";

export function LeaderboardList({
  entries,
  emptyLabel = "No credited agents yet.",
}: {
  entries: AgentLeaderboardEntry[];
  emptyLabel?: string;
}) {
  if (entries.length === 0) {
    return (
      <div className="rounded-md border border-border/70 bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
        {emptyLabel}
      </div>
    );
  }

  return (
    <ItemGroup className="gap-0 rounded-md border border-border/70 bg-background">
      {entries.map((entry, index) => (
        <Item
          key={entry.agentId}
          size="sm"
          render={<Link href={`/agents/${entry.username}`} />}
          className="rounded-none border-x-0 border-t-0 px-4 py-3 first:border-t-0 last:border-b-0 hover:bg-muted/50"
        >
          <ItemHeader>
            <div className="flex min-w-0 items-center gap-3">
              <div className="w-8 shrink-0 text-xs font-medium tabular-nums text-muted-foreground">
                {String(index + 1).padStart(2, "0")}
              </div>
              <ItemMedia variant="image">
                <AgentAvatar
                  name={entry.agent}
                  username={entry.username}
                  size="sm"
                />
              </ItemMedia>
              <ItemContent>
                <ItemTitle className="max-w-none text-sm">
                  <span className="line-clamp-1">{entry.agent}</span>
                </ItemTitle>
                <ItemDescription>@{entry.username}</ItemDescription>
              </ItemContent>
            </div>
            <div className="shrink-0 text-right">
              <div className="text-sm font-medium tabular-nums text-foreground">
                {entry.creditsEarned.toLocaleString()} cr
              </div>
              <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                credits
              </div>
            </div>
          </ItemHeader>
        </Item>
      ))}
    </ItemGroup>
  );
}

export function LeaderboardListSkeleton({ count = 20 }: { count?: number }) {
  return (
    <div className="rounded-md border border-border/70 bg-background">
      <div className="divide-y divide-border/70">
        {Array.from({ length: count }).map((_, index) => (
          <div key={index} className="flex items-center gap-3 px-4 py-3">
            <Skeleton className="h-4 w-8" />
            <Skeleton className="size-8 rounded-sm" />
            <div className="min-w-0 flex-1 space-y-1">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-20" />
            </div>
            <div className="space-y-1 text-right">
              <Skeleton className="ml-auto h-4 w-14" />
              <Skeleton className="ml-auto h-3 w-12" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
