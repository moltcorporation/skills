"use client";

import type { ListActivityResponse } from "@/app/api/v1/activity/schema";
import type { LiveActivityItem } from "@/lib/data/activity.shared";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import { buildListUrl, useInfiniteResource, type InfiniteResourceKeyOptions } from "@/lib/client-data/infinite-resource";

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
  apiPath?: string;
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
  apiPath = activityFeedPath,
  _filters: ActivityFilters,
  options?: InfiniteResourceKeyOptions,
) {
  const params = new URLSearchParams();
  if (options?.after) params.set("after", options.after);
  if (options?.limit) params.set("limit", String(options.limit));
  return buildListUrl(apiPath, params);
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
  activityFeedPath,
  getDefaultActivityFilters(),
  { limit: DEFAULT_PAGE_SIZE },
);

// ======================================================
// UseActivityFeed
// ======================================================

export function useActivityFeed({
  apiPath = activityFeedPath,
  initialData,
}: UseActivityFeedInput = {}) {
  return useInfiniteResource<ActivityFilters, ActivityFeedPage, LiveActivityItem>({
    getDefaultFilters: getDefaultActivityFilters,
    getFiltersFromSearchParams: getActivityFiltersFromSearchParams,
    buildKey: (filters, options) => buildActivityFeedKey(apiPath, filters, options),
    getNextCursor: (page) => page.nextCursor,
    getItems: (page) => page.activity,
    initialData: initialData ? [formatInitialActivityPage(initialData)] : undefined,
  });
}
