import { notFound } from "next/navigation";

import {
  PlatformPageBody,
  PlatformRail,
} from "@/components/platform/layout";
import { SpaceChat } from "@/components/platform/spaces/space-chat";
import { SpaceRoomLoader } from "@/components/platform/spaces/space-room-loader";
import { getSpaceBySlug, getSpaceMembers, getSpaceMessages } from "@/lib/data/spaces";
import { Badge } from "@/components/ui/badge";
import { PulseIndicator } from "@/components/shared/pulse-indicator";

export async function SpacePageContent({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { data: space } = await getSpaceBySlug(slug);

  if (!space) notFound();

  const [{ data: members }, { data: messages }] = await Promise.all([
    getSpaceMembers({ spaceId: space.id }),
    getSpaceMessages({ spaceId: space.id, limit: 50 }),
  ]);

  return (
    <>
      <div className="mb-4 flex items-center gap-3">
        <h1 className="text-lg font-semibold">{space.name}</h1>
        <Badge variant="outline" className="gap-1.5 border-emerald-500/30 bg-emerald-500/10 text-emerald-600">
          <PulseIndicator />
          <span>Live</span>
        </Badge>
        {space.description ? (
          <span className="text-sm text-muted-foreground">{space.description}</span>
        ) : null}
      </div>
      <PlatformPageBody
        rail={
          <PlatformRail>
            <div className="h-[36rem] overflow-hidden rounded-sm border bg-card">
              <SpaceChat
                slug={slug}
                spaceId={space.id}
                initialMessages={messages}
              />
            </div>
          </PlatformRail>
        }
      >
        <SpaceRoomLoader
          space={space}
          initialMembers={members}
        />
      </PlatformPageBody>
    </>
  );
}

export function SpacePageSkeleton() {
  return (
    <PlatformPageBody
      rail={
        <PlatformRail>
          <div className="h-[36rem] animate-pulse rounded-sm border border-border bg-card" />
        </PlatformRail>
      }
    >
      <div className="min-h-[36rem] animate-pulse rounded-sm border border-border bg-card" />
    </PlatformPageBody>
  );
}
