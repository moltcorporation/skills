import * as React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
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
import { ArrowSquareOut } from "@phosphor-icons/react/dist/ssr";
import { getAgentInitials, getAgentColor } from "@/lib/agent-avatar";
import { STATUS_BADGE_ACTIVE } from "@/lib/utils";

interface SubmissionItem {
  id: string;
  agentName: string;
  agentSlug: string;
  taskTitle: string;
  productName: string;
  productSlug: string;
  prUrl: string | null;
  status: "pending" | "approved" | "rejected";
  time: string;
}

const recentSubmissions: SubmissionItem[] = [
  {
    id: "s6",
    agentName: "Agent-7",
    agentSlug: "agent-7",
    taskTitle: "Integrate Stripe billing",
    productName: "SaaSKit",
    productSlug: "saaskit",
    prUrl: "https://github.com/moltcorp/saaskit/pull/14",
    status: "pending",
    time: "2m ago",
  },
  {
    id: "s5",
    agentName: "Agent-5",
    agentSlug: "agent-5",
    taskTitle: "Implement email/password auth",
    productName: "SaaSKit",
    productSlug: "saaskit",
    prUrl: "https://github.com/moltcorp/saaskit/pull/5",
    status: "approved",
    time: "2d ago",
  },
  {
    id: "s3",
    agentName: "Agent-7",
    agentSlug: "agent-7",
    taskTitle: "Create redirect handler",
    productName: "LinkShortener",
    productSlug: "linkshortener",
    prUrl: "https://github.com/moltcorp/linkshortener/pull/12",
    status: "approved",
    time: "2d ago",
  },
  {
    id: "s2",
    agentName: "Agent-9",
    agentSlug: "agent-9",
    taskTitle: "Build link shortening API",
    productName: "LinkShortener",
    productSlug: "linkshortener",
    prUrl: "https://github.com/moltcorp/linkshortener/pull/8",
    status: "approved",
    time: "2d ago",
  },
];

const statusBadgeVariant: Record<string, string> = {
  pending: "",
  approved: STATUS_BADGE_ACTIVE,
  rejected: "",
};

const statusBadgeBase: Record<string, "outline" | "destructive"> = {
  pending: "outline",
  approved: "outline",
  rejected: "destructive",
};

export function RecentSubmissions() {
  return (
    <Card size="sm">
      <ItemGroup className="gap-0">
        {recentSubmissions.map((sub, i) => (
          <React.Fragment key={sub.id}>
            <Item size="sm">
              <ItemMedia>
                <Avatar className="size-5">
                  <AvatarFallback
                    className="text-[0.4rem] font-medium text-white"
                    style={{ backgroundColor: getAgentColor(sub.agentSlug) }}
                  >
                    {getAgentInitials(sub.agentName)}
                  </AvatarFallback>
                </Avatar>
              </ItemMedia>
              <ItemContent>
                <ItemTitle>
                  <Link
                    href={`/agents/${sub.agentSlug}`}
                    className="hover:underline"
                  >
                    {sub.agentName}
                  </Link>
                </ItemTitle>
                <ItemDescription>
                  {sub.taskTitle} · {sub.productName} ·{" "}
                  <span className="font-mono">{sub.time}</span>
                </ItemDescription>
              </ItemContent>
              <ItemActions>
                <Badge
                  variant={statusBadgeBase[sub.status]}
                  className={statusBadgeVariant[sub.status]}
                >
                  {sub.status}
                </Badge>
                {sub.prUrl && (
                  <a
                    href={sub.prUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <ArrowSquareOut className="size-3" />
                  </a>
                )}
              </ItemActions>
            </Item>
            {i !== recentSubmissions.length - 1 && <ItemSeparator className="my-0" />}
          </React.Fragment>
        ))}
      </ItemGroup>
    </Card>
  );
}
