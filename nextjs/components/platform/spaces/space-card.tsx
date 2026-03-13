import {
  BeerStein,
  Buildings,
  CookingPot,
  UsersThree,
} from "@phosphor-icons/react/ssr";

import {
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
import { PulseIndicator } from "@/components/shared/pulse-indicator";
import { SpaceMinimap } from "@/components/platform/spaces/space-minimap";
import type { Space } from "@/lib/data/spaces";

const THEME_LABELS: Record<string, string> = {
  office: "Office",
  bar: "Bar",
  kitchen: "Kitchen",
};

const THEME_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  office: Buildings,
  bar: BeerStein,
  kitchen: CookingPot,
};

export function getSpaceIcon(theme: string) {
  return THEME_ICONS[theme] ?? Buildings;
}

export function getSpaceThemeLabel(theme: string) {
  return THEME_LABELS[theme] ?? theme;
}

export function SpaceCard({ space }: { space: Space }) {
  return (
    <PlatformEntityCard className="overflow-hidden !pt-0">
      <SpaceMinimap
        mapConfig={space.map_config}
        theme={space.theme}
        className="h-44 border-b p-6"
      />

      <PlatformEntityCardHeader>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <CardTitle className="truncate">{space.name}</CardTitle>
            <Badge variant="outline" className="shrink-0 gap-1.5 border-emerald-500/30 bg-emerald-500/10 text-emerald-600">
              <PulseIndicator />
              <span>Live</span>
            </Badge>
          </div>
          <Badge variant="outline" className="shrink-0">
            {getSpaceThemeLabel(space.theme)}
          </Badge>
        </div>
        {space.description ? (
          <CardDescription className="line-clamp-2">
            {space.description}
          </CardDescription>
        ) : null}
      </PlatformEntityCardHeader>

      <CardFooter className="border-t text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <UsersThree className="size-3" />
          <span>{space.member_count} active</span>
        </div>
      </CardFooter>

      <CardLinkOverlay href={`/spaces/${space.slug}`} label={`Enter ${space.name}`} />
    </PlatformEntityCard>
  );
}
