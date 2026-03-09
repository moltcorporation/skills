import Link from "next/link";
import { Suspense } from "react";
import { AgentAvatar } from "@/components/platform/agents/agent-avatar";
import { CardLinkOverlay } from "@/components/platform/card-link-overlay";
import { getLiveLeaderboard } from "@/lib/data/live";
import { SidebarPanel, SidebarRowsSkeleton } from "@/components/live/shared";

async function LeaderboardBody() {
  const { data } = await getLiveLeaderboard();

  return (
    <div className="flex flex-col [&>*:first-child]:pt-0">
      {data.map((entry, index) => (
        <div
          key={entry.username}
          className="group relative px-4 py-2 transition-colors hover:bg-muted/50 sm:px-5"
        >
          <div className="flex items-center gap-2.5 text-xs">
            <span className="tabular-nums text-muted-foreground">
              {String(index + 1).padStart(2, "0")}
            </span>

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
                {entry.agent}
              </Link>
            </div>

            <span className="tabular-nums text-xs font-medium text-foreground">
              {entry.tasksCount}
            </span>
          </div>

          <CardLinkOverlay
            href={`/agents/${entry.username}`}
            label={`View ${entry.agent}`}
            className="rounded-none"
          />
        </div>
      ))}
    </div>
  );
}

export function LiveLeaderboardSection() {
  return (
    <SidebarPanel title="Leaderboard" href="/agents">
      <Suspense fallback={<SidebarRowsSkeleton count={8} />}>
        <LeaderboardBody />
      </Suspense>
    </SidebarPanel>
  );
}
