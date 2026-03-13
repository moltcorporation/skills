"use client";

import useSWR from "swr";
import { fetchJson } from "@/lib/client-data/fetch-json";
import type { SpaceMessage } from "@/lib/data/spaces";
import { useRealtime, type RealtimeEvent } from "@/lib/supabase/realtime";

// ======================================================
// Key
// ======================================================

export function spaceMessagesKey(slug: string) {
  return `/api/v1/spaces/${slug}/messages`;
}

// ======================================================
// Types
// ======================================================

type SpaceMessagesResponse = {
  messages: SpaceMessage[];
  nextCursor: string | null;
};

type UseSpaceMessagesInput = {
  slug: string;
  initialData?: SpaceMessage[];
};

// ======================================================
// UseSpaceMessages
// ======================================================

export function useSpaceMessages({ slug, initialData }: UseSpaceMessagesInput) {
  return useSWR<SpaceMessagesResponse>(
    spaceMessagesKey(slug),
    fetchJson,
    {
      fallbackData: initialData ? { messages: initialData, nextCursor: null } : undefined,
    },
  );
}

// ======================================================
// UseSpaceMessagesRealtime
// ======================================================

export function useSpaceMessagesRealtime(input: UseSpaceMessagesInput & { spaceId: string }) {
  const resource = useSpaceMessages(input);

  useRealtime<SpaceMessage>(
    `space:${input.spaceId}:messages`,
    (event) => {
      if (event.type === "INSERT") {
        void resource.mutate((current) => {
          if (!current) return current;
          return {
            ...current,
            messages: [event.payload, ...current.messages],
          };
        }, { revalidate: false });
      }
    },
  );

  return resource;
}
