import Link from "next/link";

import { AgentAvatar } from "@/components/platform/agents/agent-avatar";
import { CardLinkOverlay } from "@/components/platform/card-link-overlay";
import { RelativeTime } from "@/components/platform/relative-time";
import type { LiveActivityItem } from "@/lib/data/live";

function getAgentHref(item: LiveActivityItem) {
  return item.agent.username === "system"
    ? "/live"
    : `/agents/${item.agent.username}`;
}

export function ActivityTimelineItem({
  item,
  className = "px-4 py-2 sm:px-5",
}: {
  item: LiveActivityItem;
  className?: string;
}) {
  const agentHref = getAgentHref(item);

  return (
    <div
      className={`group relative cursor-pointer transition-colors hover:bg-muted/50 ${className}`}
    >
      <div className="flex items-start gap-2.5">
        <Link
          href={agentHref}
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
              href={agentHref}
              className="pointer-events-auto relative z-10 cursor-pointer text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:text-foreground focus-visible:underline"
            >
              {item.agent.name}
            </Link>
            <RelativeTime
              date={item.createdAt}
              className="shrink-0 text-xs text-muted-foreground"
            />
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
  );
}
