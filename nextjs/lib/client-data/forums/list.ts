"use client";

import type { ListForumsResponse } from "@/app/api/v1/forums/schema";
import type { Forum } from "@/lib/data/forums";
import { DEFAULT_PAGE_SIZE, FORUM_FILTER_OPTIONS, PLATFORM_SORT_OPTIONS } from "@/lib/constants";
import { buildListUrl, useInfiniteResource, type InfiniteResourceKeyOptions } from "@/lib/client-data/infinite-resource";

type ForumFilterValue = (typeof FORUM_FILTER_OPTIONS)[number]["value"];
type ForumSortValue = (typeof PLATFORM_SORT_OPTIONS)[number]["value"];

export type ForumFilters = {
  search: string;
  type: ForumFilterValue;
  sort: ForumSortValue;
};

type ForumsListPage = Pick<ListForumsResponse, "forums" | "nextCursor">;

const forumsListPath = "/api/v1/forums";

function getForumSort(sort?: string): ForumSortValue {
  return sort === "oldest" ? "oldest" : "newest";
}

function getForumTypeFilter(type?: string): ForumFilterValue {
  return FORUM_FILTER_OPTIONS.some((option) => option.value === type)
    ? (type as ForumFilterValue)
    : "all";
}

export function getDefaultForumFilters(): ForumFilters {
  return { search: "", type: "all", sort: "newest" };
}

export function getForumFiltersFromSearchParams(
  params: URLSearchParams,
): ForumFilters {
  return {
    search: params.get("search") ?? "",
    type: getForumTypeFilter(params.get("type") ?? undefined),
    sort: getForumSort(params.get("sort") ?? undefined),
  };
}

export function buildForumsListKey(
  filters: ForumFilters,
  options?: InfiniteResourceKeyOptions,
) {
  const params = new URLSearchParams();

  if (filters.search) params.set("search", filters.search);
  if (filters.type !== "all") params.set("type", filters.type);
  if (filters.sort !== "newest") params.set("sort", filters.sort);
  if (options?.after) params.set("after", options.after);
  if (options?.limit) params.set("limit", String(options.limit));

  return buildListUrl(forumsListPath, params);
}

export const defaultForumsListKey = buildForumsListKey(
  getDefaultForumFilters(),
  { limit: DEFAULT_PAGE_SIZE },
);

export function useForumsList() {
  return useInfiniteResource<ForumFilters, ForumsListPage, Forum>({
    getDefaultFilters: getDefaultForumFilters,
    getFiltersFromSearchParams: getForumFiltersFromSearchParams,
    buildKey: buildForumsListKey,
    getNextCursor: (page) => page.nextCursor,
    getItems: (page) => page.forums,
  });
}
