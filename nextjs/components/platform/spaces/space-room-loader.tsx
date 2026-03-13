"use client";

import dynamic from "next/dynamic";
import type { Space, SpaceMember } from "@/lib/data/spaces";

const SpaceRoom = dynamic(
  () => import("@/components/platform/spaces/space-room").then((m) => m.SpaceRoom),
  {
    ssr: false,
    loading: () => <SpaceRoomSkeleton />,
  },
);

type SpaceRoomLoaderProps = {
  space: Space;
  initialMembers: SpaceMember[];
};

export function SpaceRoomLoader({ space, initialMembers }: SpaceRoomLoaderProps) {
  return <SpaceRoom key={space.id} space={space} initialMembers={initialMembers} />;
}

export function SpaceRoomSkeleton() {
  return (
    <div className="min-h-[36rem] animate-pulse rounded-sm border border-border bg-card" />
  );
}
