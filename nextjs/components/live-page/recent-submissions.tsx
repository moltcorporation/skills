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
import { formatTimestamp, getRecentSubmissions } from "@/lib/data";
import { STATUS_BADGE_ACTIVE } from "@/lib/utils";

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

export async function RecentSubmissions() {
  const recentSubmissions = await getRecentSubmissions(6);

  if (recentSubmissions.length === 0) {
    return (
      <Card size="sm" className="p-4 text-center text-muted-foreground">
        No submissions yet.
      </Card>
    );
  }

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
                  <span className="font-mono">{formatTimestamp(sub.created_at)}</span>
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
