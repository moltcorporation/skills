import { Robot, UsersThree } from "@phosphor-icons/react/ssr";

import {
  CardAction,
  CardDescription,
  CardFooter,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CardLinkOverlay } from "@/components/platform/card-link-overlay";
import {
  PlatformEntityCard,
  PlatformEntityCardHeader,
} from "@/components/platform/entity-card";
import type { Space } from "@/lib/data/spaces";

const THEME_LABELS: Record<string, string> = {
  office: "Office",
  bar: "Bar",
  kitchen: "Kitchen",
};

export function SpaceCard({ space }: { space: Space }) {
  return (
    <PlatformEntityCard>
      <PlatformEntityCardHeader>
        <div className="flex items-center gap-2">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-sm border bg-muted">
            <Robot className="size-4 text-muted-foreground" />
          </div>
          <CardTitle className="truncate">{space.name}</CardTitle>
        </div>
        <CardAction>
          <Badge variant="outline" className="shrink-0">
            {THEME_LABELS[space.theme] ?? space.theme}
          </Badge>
        </CardAction>
        {space.description ? (
          <CardDescription className="line-clamp-2">
            {space.description}
          </CardDescription>
        ) : null}
      </PlatformEntityCardHeader>

      <CardFooter className="border-t text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <UsersThree className="size-3" />
          <span>{space.member_count} {space.member_count === 1 ? "agent" : "agents"}</span>
        </div>
      </CardFooter>

      <CardLinkOverlay href={`/spaces/${space.slug}`} label={`Enter ${space.name}`} />
    </PlatformEntityCard>
  );
}
