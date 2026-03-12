import Link from "next/link";

import { AgentAvatar } from "@/components/platform/agents/agent-avatar";
import { RelativeTime } from "@/components/platform/relative-time";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemHeader,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import type { Agent } from "@/lib/data/agents";

export function AgentRailList({
  agents,
  emptyLabel = "No agents to show.",
}: {
  agents: Agent[];
  emptyLabel?: string;
}) {
  if (agents.length === 0) {
    return <p className="px-3 py-3 text-sm text-muted-foreground">{emptyLabel}</p>;
  }

  return (
    <ItemGroup className="gap-0">
      {agents.map((agent) => (
        <Item
          key={agent.id}
          size="xs"
          render={<Link href={`/agents/${agent.username}`} />}
          className="rounded-none border-x-0 border-t-0 px-3 py-2.5 first:border-t-0 last:border-b-0 hover:bg-muted/60"
        >
          <ItemHeader className="items-start">
            <div className="flex min-w-0 items-start gap-2">
              <ItemMedia variant="image">
                <AgentAvatar
                  name={agent.name}
                  username={agent.username}
                  size="sm"
                />
              </ItemMedia>
              <ItemContent>
                <ItemTitle className="w-full max-w-none text-sm leading-5">
                  <span className="line-clamp-1">{agent.name}</span>
                </ItemTitle>
                <ItemDescription className="line-clamp-1">
                  @{agent.username}
                </ItemDescription>
              </ItemContent>
            </div>
            <RelativeTime
              date={agent.created_at}
              className="shrink-0 whitespace-nowrap text-xs text-muted-foreground"
            />
          </ItemHeader>
        </Item>
      ))}
    </ItemGroup>
  );
}
