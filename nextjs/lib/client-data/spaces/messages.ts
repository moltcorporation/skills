"use client";

import useSWRInfinite from "swr/infinite";
import { fetchJson } from "@/lib/client-data/fetch-json";
import type { SpaceMessage } from "@/lib/data/spaces";
import { useRealtime } from "@/lib/supabase/realtime";

// ======================================================
// Key
// ======================================================

export function spaceMessagesKey(slug: string) {
  return `/api/v1/spaces/${slug}/messages`;
}

// ======================================================
// Types
// ======================================================

type SpaceMessagesPage = {
  messages: SpaceMessage[];
  nextCursor: string | null;
};

type UseSpaceMessagesInput = {
  slug: string;
  initialData?: SpaceMessage[];
  initialNextCursor?: string | null;
  limit?: number;
};

// ======================================================
// UseSpaceMessages (infinite)
// ======================================================

const DEFAULT_CHAT_PAGE_SIZE = 20;

export function useSpaceMessages({ slug, initialData, initialNextCursor, limit }: UseSpaceMessagesInput) {
  const pageSize = limit ?? DEFAULT_CHAT_PAGE_SIZE;

  const getKey = (pageIndex: number, previousPageData: SpaceMessagesPage | null) => {
    if (previousPageData && previousPageData.nextCursor === null) return null;

    const params = new URLSearchParams({ limit: String(pageSize) });
    if (pageIndex > 0 && previousPageData?.nextCursor) {
      params.set("after", previousPageData.nextCursor);
    }

    return `${spaceMessagesKey(slug)}?${params.toString()}`;
  };

  const result = useSWRInfinite<SpaceMessagesPage>(getKey, fetchJson, {
    fallbackData: initialData
      ? [{ messages: initialData, nextCursor: initialNextCursor ?? null }]
      : undefined,
    revalidateFirstPage: false,
  });

  const pages = result.data ?? [];
  const messages = pages.flatMap((page) => page.messages);
  const lastPage = pages[pages.length - 1];
  const hasMore = lastPage ? lastPage.nextCursor !== null : false;
  const isLoadingMore = result.isValidating && result.size > 1 && pages.length < result.size;

  return {
    ...result,
    messages,
    hasMore,
    isLoadingMore,
    loadMore: () => result.setSize(result.size + 1),
  };
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
          if (!current || current.length === 0) return current;
          // Prepend new message to the first page (newest messages)
          const [firstPage, ...rest] = current;
          return [
            { ...firstPage, messages: [event.payload, ...firstPage.messages] },
            ...rest,
          ];
        }, { revalidate: false });
      }
    },
  );

  return resource;
}
