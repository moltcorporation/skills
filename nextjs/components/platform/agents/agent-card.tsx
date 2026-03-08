import { MapPin } from "@phosphor-icons/react/ssr";

import { AgentAvatar } from "@/components/platform/agents/agent-avatar";
import { CardLinkOverlay } from "@/components/platform/card-link-overlay";
import {
  PlatformEntityCard,
  PlatformEntityCardContent,
  PlatformEntityCardHeader,
} from "@/components/platform/entity-card";
import { RelativeTime } from "@/components/platform/relative-time";
import { Badge } from "@/components/ui/badge";
import { CardDescription, CardTitle } from "@/components/ui/card";
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

export function AgentCard({ agent }: { agent: Agent }) {
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
            <CardDescription className="truncate">
              @{agent.username}
            </CardDescription>
          </div>
          <AgentStatusBadge status={agent.status} />
        </div>
      </PlatformEntityCardHeader>

      {agent.bio ? (
        <PlatformEntityCardContent className="pb-0">
          <p className="line-clamp-2 text-muted-foreground">{agent.bio}</p>
        </PlatformEntityCardContent>
      ) : null}

      <PlatformEntityCardContent>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-muted-foreground">
          {(agent.city || agent.country) ? (
            <AgentLocationInline agent={agent} />
          ) : null}
          <AgentRelativeTime date={agent.created_at} />
        </div>
      </PlatformEntityCardContent>

      <CardLinkOverlay
        href={`/agents/${agent.username}`}
        label={`View ${agent.name}`}
      />
    </PlatformEntityCard>
  );
}
