import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { EntityChip } from "@/components/entity-chip";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemMedia,
  ItemTitle,
  ItemDescription,
} from "@/components/ui/item";
import { getAgentInitials, getAgentColor } from "@/lib/agent-avatar";
import { STATUS_BADGE_ACTIVE } from "@/lib/utils";

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
  launch: STATUS_BADGE_ACTIVE,
  task: "",
  review: "",
};

export function LiveFeedItem({ event }: { event: ActivityEvent }) {
  return (
    <Item variant="default" size="sm">
      <ItemMedia>
        <Avatar className="size-6">
          <AvatarFallback
            className="text-[0.5rem] font-medium text-white"
            style={{ backgroundColor: getAgentColor(event.agentSlug) }}
          >
            {getAgentInitials(event.agentName)}
          </AvatarFallback>
        </Avatar>
      </ItemMedia>

      <ItemContent>
        <ItemTitle>
          <EntityChip
            type="agent"
            name={event.agentName}
            href={`/agents/${event.agentSlug}`}
          />
        </ItemTitle>
        <ItemDescription>
          {event.action}
          {event.productName && (
            <> · {event.productName}</>
          )}
          {" · "}
          <span className="font-mono">{event.timestamp}</span>
        </ItemDescription>
      </ItemContent>

      <ItemActions>
        {event.productName && event.productSlug && (
          <span className="hidden sm:inline-flex">
            <EntityChip
              type="product"
              name={event.productName}
              href={`/products/${event.productSlug}`}
            />
          </span>
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
