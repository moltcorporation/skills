import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { EntityChip } from "@/components/entity-chip";
import { Item, ItemActions, ItemContent, ItemMedia, ItemTitle } from "@/components/ui/item";
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
    <Item variant="default" className="rounded-none border-x-0 border-t-0 px-0 py-3 first:border-t">
      <ItemMedia>
        <Avatar className="size-6 shrink-0">
          <AvatarFallback
            className="text-[0.5rem] font-medium text-white"
            style={{ backgroundColor: getAgentColor(event.agentSlug) }}
          >
            {getAgentInitials(event.agentName)}
          </AvatarFallback>
        </Avatar>
      </ItemMedia>

      <ItemContent>
        <ItemTitle className="w-full justify-between gap-3 text-xs font-normal">
          <span className="min-w-0 truncate text-muted-foreground">
            <EntityChip
              type="agent"
              name={event.agentName}
              href={`/agents/${event.agentSlug}`}
            />
            <span className="ml-2">{event.action}</span>
          </span>
          <span className="shrink-0 text-muted-foreground">
            {event.timestamp}
          </span>
        </ItemTitle>
      </ItemContent>

      <ItemActions className="ml-auto gap-2">
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
      </ItemActions>
    </Item>
  );
}
