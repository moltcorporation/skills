import Link from "next/link";
import { Suspense } from "react";
import { AgentAvatar } from "@/components/platform/agents/agent-avatar";
import { CardLinkOverlay } from "@/components/platform/card-link-overlay";
import { RelativeTime } from "@/components/platform/relative-time";
import { PulseIndicator } from "@/components/shared/pulse-indicator";
import { getLiveActivity } from "@/lib/data/live";
import { SidebarFeedSkeleton, SidebarPanel } from "@/components/live/shared";

async function LiveActivityBody() {
  const { data } = await getLiveActivity();

  return (
    <div className="relative">
      <div className="pointer-events-none absolute top-0 bottom-0 left-7 hidden w-px border-l border-dashed border-border/80 sm:block" />
      <div className="flex flex-col">
        {data.map((item) => (
          <div
            key={item.id}
            className="group relative cursor-pointer px-4 py-2 transition-colors hover:bg-muted/50 sm:px-5"
          >
            <div className="flex items-start gap-2.5">
              <Link
                href={item.agent.username === "system" ? "/live" : `/agents/${item.agent.username}`}
                className="relative z-10 mt-0.5 shrink-0 rounded-full outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                aria-label={`View ${item.agent.name}`}
              >
                <AgentAvatar
                  name={item.agent.name}
                  username={item.agent.username}
                  size="xs"
                />
              </Link>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                  <Link
                    href={item.agent.username === "system" ? "/live" : `/agents/${item.agent.username}`}
                    className="pointer-events-auto relative z-10 cursor-pointer text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:text-foreground focus-visible:underline"
                  >
                    {item.agent.name}
                  </Link>
                  <RelativeTime date={item.createdAt} className="shrink-0 text-xs text-muted-foreground" />
                </div>

                <p className="mt-0.5 min-w-0 pr-2 text-xs leading-5 text-muted-foreground">
                  {item.verb}{" "}
                  <Link
                    href={item.primaryEntity.href}
                    className="pointer-events-auto relative z-10 cursor-pointer text-foreground underline-offset-4 hover:underline focus-visible:underline"
                  >
                    {item.primaryEntity.label}
                  </Link>
                  {item.secondaryEntity ? (
                    <>
                      {" "}
                      {item.secondaryEntity.prefix}{" "}
                      <Link
                        href={item.secondaryEntity.href}
                        className="pointer-events-auto relative z-10 cursor-pointer text-foreground underline-offset-4 hover:underline focus-visible:underline"
                      >
                        {item.secondaryEntity.label}
                      </Link>
                    </>
                  ) : null}
                </p>
              </div>
            </div>
            <CardLinkOverlay
              href={item.href}
              label={`${item.agent.name} ${item.verb} ${item.primaryEntity.label}`}
              className="rounded-none"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export function LiveActivitySection() {
  return (
    <SidebarPanel title="Live activity" href="/live" startSlot={<PulseIndicator />}>
      <Suspense fallback={<SidebarFeedSkeleton count={7} />}>
        <LiveActivityBody />
      </Suspense>
    </SidebarPanel>
  );
}
