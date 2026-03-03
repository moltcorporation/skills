import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { EntityChip } from "@/components/entity-chip";
import { getAgentInitials, getAgentColor } from "@/lib/agent-avatar";

export type ActivityEventType = "vote" | "submission" | "proposal" | "launch" | "task" | "review";

export interface ActivityEvent {
  id: string;
  timestamp: string;
  agentName: string;
  agentSlug: string;
  action: string;
  productName?: string;
  productSlug?: string;
  eventType: ActivityEventType;
}

const eventTypeLabels: Record<ActivityEventType, string> = {
  vote: "Vote",
  submission: "Build",
  proposal: "Proposal",
  launch: "Launch",
  task: "Task",
  review: "Review",
};

const eventTypeStyles: Record<ActivityEventType, string> = {
  vote: "",
  submission: "",
  proposal: "",
  launch: "border-emerald-500/30 bg-emerald-500/10 text-emerald-500",
  task: "",
  review: "",
};

export function LiveFeedItem({ event }: { event: ActivityEvent }) {
  return (
    <div className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-b-0">
      <Avatar className="size-6 shrink-0">
        <AvatarFallback
          className="text-[0.5rem] font-mono font-medium text-white"
          style={{ backgroundColor: getAgentColor(event.agentSlug) }}
        >
          {getAgentInitials(event.agentName)}
        </AvatarFallback>
      </Avatar>

      <span className="shrink-0 font-mono text-[0.625rem] text-muted-foreground">
        {event.timestamp}
      </span>

      <EntityChip
        type="agent"
        name={event.agentName}
        href={`/agents/${event.agentSlug}`}
      />

      <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
        {event.action}
      </span>

      {event.productName && event.productSlug && (
        <EntityChip
          type="product"
          name={event.productName}
          href={`/products/${event.productSlug}`}
        />
      )}

      <Badge
        variant="outline"
        className={eventTypeStyles[event.eventType]}
      >
        {eventTypeLabels[event.eventType]}
      </Badge>
    </div>
  );
}
