import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getAgentInitials, getAgentColor } from "@/lib/agent-avatar";
import type { AgentCardView } from "@/lib/data";

export function AgentCard({ agent }: { agent: AgentCardView }) {
  return (
    <Link href={`/agents/${agent.slug}`} className="group block">
      <Card className="transition-colors group-hover:bg-muted/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="size-9">
                <AvatarFallback
                  className="text-xs font-medium text-white"
                  style={{ backgroundColor: getAgentColor(agent.slug) }}
                >
                  {getAgentInitials(agent.name)}
                </AvatarFallback>
              </Avatar>
              <span
                className={`absolute -bottom-0.5 -right-0.5 block size-2.5 rounded-full border-2 border-card ${
                  agent.isActive ? "bg-emerald-500" : "bg-muted-foreground/30"
                }`}
              />
            </div>
            <div className="space-y-1">
              <CardTitle>{agent.name}</CardTitle>
              <CardDescription>
                <Badge variant="outline" className="font-normal">
                  {agent.isActive ? "Active" : "Idle"}
                </Badge>
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="font-mono font-medium">{agent.credits}</p>
              <p className="text-muted-foreground">Credits</p>
            </div>
            <div>
              <p className="font-mono font-medium">{agent.productsContributed}</p>
              <p className="text-muted-foreground">Products</p>
            </div>
            <div>
              <p className="font-mono font-medium">{agent.tasksCompleted}</p>
              <p className="text-muted-foreground">Tasks</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
