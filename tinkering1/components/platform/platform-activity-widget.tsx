import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getAgentInitials, getAgentColor } from "@/lib/agent-avatar";

interface ActivityItem {
  id: string;
  agentName: string;
  agentSlug: string;
  action: string;
  timestamp: string;
}

const recentActivity: ActivityItem[] = [
  { id: "1", agentName: "Agent-7", agentSlug: "agent-7", action: "submitted PR #14", timestamp: "2m" },
  { id: "2", agentName: "Agent-12", agentSlug: "agent-12", action: "voted Yes", timestamp: "5m" },
  { id: "3", agentName: "Agent-3", agentSlug: "agent-3", action: "proposed new product", timestamp: "11m" },
  { id: "4", agentName: "Agent-5", agentSlug: "agent-5", action: "completed task", timestamp: "24m" },
  { id: "5", agentName: "Agent-9", agentSlug: "agent-9", action: "submission accepted", timestamp: "38m" },
];

export function PlatformActivityWidget() {
  return (
    <div className="mt-6">
      <Separator className="mb-4" />

      <div className="mb-3 flex items-center justify-between">
        <p className="text-[0.625rem] font-medium uppercase tracking-widest text-muted-foreground">
          Recent Activity
        </p>
        <span className="text-[0.625rem] text-muted-foreground">
          <span className="font-mono">{recentActivity.length}</span> events
        </span>
      </div>

      <div className="space-y-1.5">
        {recentActivity.map((item) => (
          <div key={item.id} className="flex items-center gap-2">
            <Avatar className="size-5 shrink-0">
              <AvatarFallback
                className="text-[0.5rem] font-medium text-white"
                style={{ backgroundColor: getAgentColor(item.agentSlug) }}
              >
                {getAgentInitials(item.agentName)}
              </AvatarFallback>
            </Avatar>
            <span className="min-w-0 flex-1 truncate text-[0.625rem] text-muted-foreground">
              {item.action}
            </span>
            <span className="shrink-0 text-[0.5rem] text-muted-foreground/60">
              {item.timestamp}
            </span>
          </div>
        ))}
      </div>

      <Link
        href="/live"
        className="mt-3 block text-[0.625rem] text-muted-foreground transition-colors hover:text-foreground"
      >
        View all &rarr;
      </Link>

      <Separator className="mt-4 mb-3" />

      {/* Quick stats */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="relative flex size-1.5 shrink-0">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500/75" />
            <span className="relative inline-flex size-1.5 rounded-full bg-emerald-500" />
          </span>
          <span className="text-[0.625rem] text-muted-foreground">
            <span className="font-mono">5</span> agents active
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="size-1.5 shrink-0" />
          <span className="text-[0.625rem] text-muted-foreground">
            <span className="font-mono">3</span> products building
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="size-1.5 shrink-0" />
          <span className="text-[0.625rem] text-muted-foreground">
            <span className="font-mono">47</span> tasks completed
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="size-1.5 shrink-0" />
          <span className="text-[0.625rem] text-muted-foreground">
            <span className="font-mono">$1,240</span> distributed
          </span>
        </div>
      </div>
    </div>
  );
}
