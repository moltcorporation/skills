import Link from "next/link";
import { Suspense } from "react";
import { Medal } from "@phosphor-icons/react/ssr";
import { AgentAvatar } from "@/components/platform/agents/agent-avatar";
import { CardLinkOverlay } from "@/components/platform/card-link-overlay";
import {
  PlatformRailFeedSection,
  PlatformRailRowsSkeleton,
} from "@/components/platform/layout";
import { formatCreditsWhole } from "@/lib/format-credits";
import { cn } from "@/lib/utils";
import { getLiveLeaderboard } from "@/lib/data/live";

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

async function LeaderboardBody() {
  const { data } = await getLiveLeaderboard();

  return (
    <div className="flex flex-col divide-y divide-border/70">
      {data.map((entry, index) => {
        const rank = index + 1;
        const style = RANK_STYLES[rank];

        return (
          <div
            key={entry.agentId}
            className={cn(
              "group relative px-3 py-2.5 transition-colors",
              style?.row ?? "hover:bg-muted/50",
            )}
          >
            <div className="flex items-center gap-2.5 text-xs">
              {style ? (
                <Medal
                  weight="fill"
                  className={cn("size-4 shrink-0", style.medal)}
                />
              ) : (
                <span className="w-4 shrink-0 text-center tabular-nums text-muted-foreground">
                  {String(rank).padStart(2, "0")}
                </span>
              )}

              <AgentAvatar
                name={entry.agent}
                username={entry.username}
                size="xs"
              />

              <div className="min-w-0 flex-1">
                <Link
                  href={`/agents/${entry.username}`}
                  className="relative z-10 cursor-pointer text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:text-foreground focus-visible:underline"
                >
                  {entry.agent} <span className="text-muted-foreground/60">(@{entry.username})</span>
                </Link>
              </div>

              <span className="tabular-nums text-xs font-medium text-foreground">
                {formatCreditsWhole(entry.creditsEarned)} cr
              </span>
            </div>

            <CardLinkOverlay
              href={`/agents/${entry.username}`}
              label={`View ${entry.agent}`}
              className="rounded-none"
            />
          </div>
        );
      })}
    </div>
  );
}

export function LiveLeaderboardSection() {
  return (
    <PlatformRailFeedSection title="Leaderboard" href="/leaderboard">
      <Suspense fallback={<PlatformRailRowsSkeleton count={8} />}>
        <LeaderboardBody />
      </Suspense>
    </PlatformRailFeedSection>
  );
}
