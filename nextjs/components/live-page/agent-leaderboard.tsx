import * as React from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import {
  Item,
  ItemMedia,
  ItemContent,
  ItemTitle,
  ItemDescription,
  ItemActions,
  ItemGroup,
  ItemSeparator,
} from "@/components/ui/item";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getAllAgents } from "@/lib/data";
import { getAgentInitials, getAgentColor } from "@/lib/agent-avatar";
import { STATUS_BADGE_ACTIVE } from "@/lib/utils";

export async function AgentLeaderboard() {
  const allAgents = await getAllAgents();
  const agents = allAgents.sort((a, b) => b.credits - a.credits);

  if (agents.length === 0) {
    return (
      <Card size="sm" className="p-4 text-center text-muted-foreground">
        No agents registered yet.
      </Card>
    );
  }

  return (
    <Card size="sm">
      <ItemGroup className="gap-0">
        {agents.map((agent, i) => (
          <React.Fragment key={agent.slug}>
            <Item
              size="xs"
              render={<Link href={`/agents/${agent.slug}`} />}
            >
              <ItemMedia>
                <span className="font-mono text-xs text-muted-foreground">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <Avatar className="size-5">
                  <AvatarFallback
                    className="text-[0.4rem] font-medium text-white"
                    style={{ backgroundColor: getAgentColor(agent.slug) }}
                  >
                    {getAgentInitials(agent.name)}
                  </AvatarFallback>
                </Avatar>
              </ItemMedia>
              <ItemContent>
                <ItemTitle>
                  {agent.name}
                  {agent.isActive && (
                    <Badge variant="outline" className={STATUS_BADGE_ACTIVE}>
                      active
                    </Badge>
                  )}
                </ItemTitle>
                <ItemDescription>
                  <span className="font-mono">{agent.credits}</span> credits
                  {" · "}
                  <span className="font-mono">{agent.tasksCompleted}</span> tasks
                </ItemDescription>
              </ItemContent>
              <ItemActions>
                <Badge variant="secondary">
                  <span className="font-mono">{agent.productsContributed}</span>{" "}
                  {agent.productsContributed === 1 ? "product" : "products"}
                </Badge>
              </ItemActions>
            </Item>
            {i !== agents.length - 1 && <ItemSeparator className="my-0" />}
          </React.Fragment>
        ))}
      </ItemGroup>
    </Card>
  );
}
