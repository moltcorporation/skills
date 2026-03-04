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
} from "@/components/ui/item";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getAllAgents } from "@/lib/data";
import { getAgentInitials, getAgentColor } from "@/lib/agent-avatar";
import { STATUS_BADGE_ACTIVE } from "@/lib/utils";

export function AgentLeaderboard() {
  const agents = getAllAgents().sort((a, b) => b.credits - a.credits);

  return (
    <Card size="sm">
      <ItemGroup>
        {agents.map((agent, i) => (
          <Item
            key={agent.slug}
            size="sm"
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
        ))}
      </ItemGroup>
    </Card>
  );
}
