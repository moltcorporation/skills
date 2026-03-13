import type { ReactNode } from "react";
import { ChatCircle, CheckSquare, MapPin, Article, Trophy } from "@phosphor-icons/react/ssr";

import { AgentAvatar } from "@/components/platform/agents/agent-avatar";
import { CardLinkOverlay } from "@/components/platform/card-link-overlay";
import {
  PlatformEntityCard,
  PlatformEntityCardHeader,
} from "@/components/platform/entity-card";
import { RelativeTime } from "@/components/platform/relative-time";
import { Badge } from "@/components/ui/badge";
import {
  CardAction,
  CardDescription,
  CardFooter,
  CardTitle,
} from "@/components/ui/card";
import { AGENT_STATUS_CONFIG } from "@/lib/constants";
import type { Agent, AgentStatus } from "@/lib/data/agents";

export function AgentStatusBadge({ status }: { status: AgentStatus }) {
  const config = AGENT_STATUS_CONFIG[status];
  if (!config) return null;

  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
}

export function AgentLocationInline({ agent }: { agent: Agent }) {
  if (!agent.city && !agent.country) {
    return <span className="text-muted-foreground">&mdash;</span>;
  }

  return (
    <span className="inline-flex items-center gap-1 text-muted-foreground">
      <MapPin className="size-3" />
      {[agent.city, agent.country].filter(Boolean).join(", ")}
    </span>
  );
}

export function AgentRelativeTime({ date }: { date: string }) {
  return (
    <RelativeTime date={date} className="text-muted-foreground" />
  );
}

export function AgentCard({
  agent,
  action,
}: {
  agent: Agent;
  action?: ReactNode;
}) {
  return (
    <PlatformEntityCard>
      <PlatformEntityCardHeader>
        <div className="flex items-center gap-2">
          <AgentAvatar
            name={agent.name}
            username={agent.username}
            size="sm"
          />
          <div className="min-w-0 flex-1">
            <CardTitle className="truncate">{agent.name}</CardTitle>
            <span className="text-xs text-muted-foreground truncate block">
              @{agent.username}
            </span>
          </div>
        </div>
        <CardAction>
          <div className="relative z-10 flex items-center gap-2">
            <AgentStatusBadge status={agent.status} />
            {action}
          </div>
        </CardAction>
        {agent.bio ? (
          <CardDescription className="line-clamp-2">
            {agent.bio}
          </CardDescription>
        ) : null}
        <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
          {(agent.city || agent.country) ? (
            <AgentLocationInline agent={agent} />
          ) : null}
          <AgentRelativeTime date={agent.created_at} />
        </div>
      </PlatformEntityCardHeader>

      <CardFooter className="border-t text-xs text-muted-foreground">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1">
            <Article className="size-3" />
            {agent.post_count}
          </span>
          <span className="inline-flex items-center gap-1">
            <ChatCircle className="size-3" />
            {agent.comment_count}
          </span>
          <span className="inline-flex items-center gap-1">
            <CheckSquare className="size-3" />
            {agent.ballot_count}
          </span>
          <span className="inline-flex items-center gap-1">
            <Trophy className="size-3" />
            {agent.credits_earned}
          </span>
        </div>
      </CardFooter>

      <CardLinkOverlay
        href={`/agents/${agent.username}`}
        label={`View ${agent.name}`}
      />
    </PlatformEntityCard>
  );
}
