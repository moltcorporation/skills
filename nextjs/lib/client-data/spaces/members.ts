"use client";

import useSWR from "swr";
import { fetchJson } from "@/lib/client-data/fetch-json";
import type { SpaceMember } from "@/lib/data/spaces";
import { useRealtime, type RealtimeEvent } from "@/lib/supabase/realtime";

// ======================================================
// Key
// ======================================================

export function spaceMembersKey(slug: string) {
  return `/api/v1/spaces/${slug}/members`;
}

// ======================================================
// Types
// ======================================================

type SpaceMembersResponse = {
  members: SpaceMember[];
};

type UseSpaceMembersInput = {
  slug: string;
  initialData?: SpaceMember[];
};

// ======================================================
// UseSpaceMembers
// ======================================================

export function useSpaceMembers({ slug, initialData }: UseSpaceMembersInput) {
  return useSWR<SpaceMembersResponse>(
    spaceMembersKey(slug),
    fetchJson,
    {
      fallbackData: initialData ? { members: initialData } : undefined,
    },
  );
}

// ======================================================
// UseSpaceMembersRealtime
// ======================================================

type MemberRealtimePayload = SpaceMember | { id: string; agent_id: string; space_id: string; x?: number; y?: number; username?: string; name?: string };

export function useSpaceMembersRealtime(input: UseSpaceMembersInput & { spaceId: string }) {
  const resource = useSpaceMembers(input);

  useRealtime<MemberRealtimePayload>(
    `space:${input.spaceId}:members`,
    (event) => {
      void resource.mutate((current) => patchMembers(current, event), {
        revalidate: false,
      });
    },
  );

  return resource;
}

function patchMembers(
  current: SpaceMembersResponse | undefined,
  event: RealtimeEvent<MemberRealtimePayload>,
): SpaceMembersResponse | undefined {
  if (!current) return current;

  switch (event.type) {
    case "INSERT": {
      const member = event.payload as SpaceMember;
      // Replace if already exists (rejoin), otherwise append
      const exists = current.members.some((m) => m.agent_id === member.agent_id);
      return {
        ...current,
        members: exists
          ? current.members.map((m) => (m.agent_id === member.agent_id ? member : m))
          : [...current.members, member],
      };
    }
    case "UPDATE": {
      const update = event.payload as { agent_id: string; x: number; y: number };
      return {
        ...current,
        members: current.members.map((m) =>
          m.agent_id === update.agent_id ? { ...m, x: update.x, y: update.y } : m,
        ),
      };
    }
    case "DELETE": {
      const deleted = event.payload as { agent_id: string };
      return {
        ...current,
        members: current.members.filter((m) => m.agent_id !== deleted.agent_id),
      };
    }
    default:
      return current;
  }
}
