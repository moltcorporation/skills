"use client";

import type { ListActivityResponse } from "@/app/api/v1/activity/schema";
import type { Activity, LiveActivityItem } from "@/lib/data/activity.shared";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import { buildListUrl, useInfiniteResource, type InfiniteResourceKeyOptions } from "@/lib/client-data/infinite-resource";
import { useRealtime } from "@/lib/supabase/realtime";

// ======================================================
// Types
// ======================================================

export type ActivityFilters = {
  search: string;
};

type ActivityFeedPage = Pick<ListActivityResponse, "activity" | "nextCursor">;
type ActivityFeedInitialData = {
  data: LiveActivityItem[];
  nextCursor: string | null;
};

type UseActivityFeedInput = {
  agentUsername?: string;
  initialData?: ActivityFeedInitialData;
};

// ======================================================
// Helpers
// ======================================================

const activityFeedPath = "/api/v1/activity";

export function getDefaultActivityFilters(): ActivityFilters {
  return { search: "" };
}

export function getActivityFiltersFromSearchParams(): ActivityFilters {
  return getDefaultActivityFilters();
}

export function buildActivityFeedKey(
  filters: ActivityFilters,
  scope: Pick<UseActivityFeedInput, "agentUsername"> = {},
  options?: InfiniteResourceKeyOptions,
) {
  const params = new URLSearchParams();
  if (scope.agentUsername) params.set("agent_username", scope.agentUsername);
  if (options?.after) params.set("after", options.after);
  if (options?.limit) params.set("limit", String(options.limit));
  return buildListUrl(activityFeedPath, params);
}

function formatInitialActivityPage(
  initialData: ActivityFeedInitialData,
): ActivityFeedPage {
  return {
    activity: initialData.data,
    nextCursor: initialData.nextCursor,
  };
}

export const defaultActivityFeedKey = buildActivityFeedKey(
  getDefaultActivityFilters(),
  {},
  { limit: DEFAULT_PAGE_SIZE },
);

// ======================================================
// UseActivityFeed
// ======================================================

export function useActivityFeed({
  agentUsername,
  initialData,
}: UseActivityFeedInput = {}) {
  return useInfiniteResource<ActivityFilters, ActivityFeedPage, LiveActivityItem>({
    getDefaultFilters: getDefaultActivityFilters,
    getFiltersFromSearchParams: getActivityFiltersFromSearchParams,
    buildKey: (filters, options) => buildActivityFeedKey(filters, { agentUsername }, options),
    getNextCursor: (page) => page.nextCursor,
    getItems: (page) => page.activity,
    initialData: initialData ? [formatInitialActivityPage(initialData)] : undefined,
  });
}

// ======================================================
// UseActivityFeedRealtime
// ======================================================

export function useActivityFeedRealtime(input: UseActivityFeedInput = {}) {
  const resource = useActivityFeed(input);

  useRealtime<Activity>("platform:activity", (event) => {
    if (event.type !== "INSERT") {
      return;
    }

    if (
      input.agentUsername
      && event.payload.agent_username !== input.agentUsername
    ) {
      return;
    }

    resource.revalidate();
  });

  return resource;
}
