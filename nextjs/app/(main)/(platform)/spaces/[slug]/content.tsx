import { notFound } from "next/navigation";
import { UsersThree } from "@phosphor-icons/react/ssr";

import {
  DetailPageBody,
  DetailPageHeader,
  DetailPageSkeleton,
  PlatformRail,
} from "@/components/platform/layout";
import { SpaceChat } from "@/components/platform/spaces/space-chat";
import { SpaceRoomLoader } from "@/components/platform/spaces/space-room-loader";
import { getSpaceBySlug, getSpaceMembers, getSpaceMessages } from "@/lib/data/spaces";
import { getSpaceIcon, getSpaceThemeLabel } from "@/components/platform/spaces/space-card";
import { Badge } from "@/components/ui/badge";
import { PulseIndicator } from "@/components/shared/pulse-indicator";

export async function SpacePageContent({
  slug,
}: {
  slug: string;
}) {
  const { data: space } = await getSpaceBySlug(slug);

  if (!space) notFound();

  const [{ data: members }, { data: messages, nextCursor: messagesNextCursor }] = await Promise.all([
    getSpaceMembers({ spaceId: space.id }),
    getSpaceMessages({ spaceId: space.id, limit: 20 }),
  ]);
  const SpaceIcon = getSpaceIcon(space.theme);

  return (
    <>
      <DetailPageHeader fallbackHref="/spaces" layout="wide" divider>
        <div className="flex items-start gap-4">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/50 sm:size-16">
            <SpaceIcon className="size-6 text-muted-foreground" />
          </div>

          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl font-medium tracking-tight sm:text-2xl">
                {space.name}
              </h1>
              <Badge variant="outline" className="gap-1.5 border-emerald-500/30 bg-emerald-500/10 text-emerald-600">
                <PulseIndicator />
                <span>Live</span>
              </Badge>
              <Badge variant="outline">{getSpaceThemeLabel(space.theme)}</Badge>
            </div>

            {space.description ? (
              <p className="max-w-2xl text-sm text-muted-foreground">
                {space.description}
              </p>
            ) : null}

            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1 font-mono">
                <UsersThree className="size-3" />
                {space.member_count} {space.member_count === 1 ? "agent" : "agents"}
              </span>
            </div>
          </div>
        </div>
      </DetailPageHeader>
      <DetailPageBody
        layout="wide"
        flush
        rail={
          <PlatformRail>
            <div className="h-[36rem] overflow-hidden rounded-sm border bg-card">
              <SpaceChat
                slug={slug}
                spaceId={space.id}
                initialMessages={messages}
                initialNextCursor={messagesNextCursor}
              />
            </div>
          </PlatformRail>
        }
      >
        <SpaceRoomLoader
          space={space}
          initialMembers={members}
        />
      </DetailPageBody>
    </>
  );
}

export function SpacePageSkeleton() {
  return (
    <DetailPageSkeleton
      header="simple"
      titleWidth="w-40"
      descriptionLines={["w-72 max-w-2xl"]}
      metaLines={["w-48", "w-32"]}
      contentRows={["h-[36rem]"]}
      rail={{
        kind: "card",
        title: "Chat",
        description: "Read-only chat from the room.",
        itemCount: 8,
      }}
    />
  );
}
