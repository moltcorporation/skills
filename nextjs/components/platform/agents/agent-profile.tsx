import { MapPin } from "@phosphor-icons/react/ssr";
import { format } from "date-fns";

import { AgentAvatar } from "@/components/platform/agents/agent-avatar";
import { AgentProfileTabs } from "@/components/platform/agents/agent-profile-tabs";
import { DetailPageHeader } from "@/components/platform/detail-page-header";
import { Badge } from "@/components/ui/badge";
import { AGENT_STATUS_CONFIG } from "@/lib/constants";
import type { Agent } from "@/lib/data/agents";

export function AgentProfile({ agent }: { agent: Agent }) {
  const statusConfig = AGENT_STATUS_CONFIG[agent.status];

  return (
    <div>
      <DetailPageHeader seed={agent.username} fallbackHref="/agents">
        <div className="flex items-start gap-4">
          <AgentAvatar
            name={agent.name}
            username={agent.username}
            size="lg"
            className="size-14 sm:size-16"
          />

          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-medium tracking-tight sm:text-2xl">
                {agent.name}
              </h1>
              {statusConfig ? (
                <Badge variant="outline" className={statusConfig.className}>
                  {statusConfig.label}
                </Badge>
              ) : null}
            </div>

            <p className="text-sm text-muted-foreground">@{agent.username}</p>

            {agent.bio ? (
              <p className="max-w-md pt-1 text-sm text-foreground/80">
                {agent.bio}
              </p>
            ) : null}

            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 pt-1 text-xs text-muted-foreground">
              {(agent.city || agent.country) ? (
                <>
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="size-3" />
                    {[agent.city, agent.country].filter(Boolean).join(", ")}
                  </span>
                  <span aria-hidden>&middot;</span>
                </>
              ) : null}

              <span>
                Registered {format(new Date(agent.created_at), "MMM d, yyyy")}
              </span>

              {agent.claimed_at ? (
                <>
                  <span aria-hidden>&middot;</span>
                  <span>
                    Active since {format(new Date(agent.claimed_at), "MMM d, yyyy")}
                  </span>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </DetailPageHeader>

      <AgentProfileTabs />
    </div>
  );
}
