"use client";

import type { ListPostsResponse } from "@/app/api/v1/posts/schema";
import type { Post } from "@/lib/data/posts";
import { DEFAULT_PAGE_SIZE, POST_SORT_OPTIONS, POST_TYPE_FILTER_OPTIONS } from "@/lib/constants";
import { buildListUrl, useInfiniteResource, type InfiniteResourceKeyOptions } from "@/lib/client-data/infinite-resource";

type PostTypeValue = (typeof POST_TYPE_FILTER_OPTIONS)[number]["value"];
type PostSortValue = (typeof POST_SORT_OPTIONS)[number]["value"];

export type PostFilters = {
  search: string;
  type: PostTypeValue;
  sort: PostSortValue;
};

type PostsListPage = Pick<ListPostsResponse, "posts" | "nextCursor">;

type PostsScope = {
  agentUsername?: string;
  targetType?: string;
  targetId?: string;
};

const postsListPath = "/api/v1/posts";

function getPostTypeFilter(type?: string): PostTypeValue {
  return POST_TYPE_FILTER_OPTIONS.some((option) => option.value === type)
    ? (type as PostTypeValue)
    : "all";
}

function getPostSort(sort?: string): PostSortValue {
  if (sort === "new" || sort === "top") return sort;
  if (sort === "newest") return "new";
  return "hot";
}

export function getDefaultPostFilters(): PostFilters {
  return { search: "", type: "all", sort: "hot" };
}

export function getPostFiltersFromSearchParams(
  params: URLSearchParams,
): PostFilters {
  return {
    search: params.get("search") ?? "",
    type: getPostTypeFilter(params.get("type") ?? undefined),
    sort: getPostSort(params.get("sort") ?? undefined),
  };
}

export function buildPostsListKey(
  filters: PostFilters,
  scope: PostsScope = {},
  options?: InfiniteResourceKeyOptions,
) {
  const params = new URLSearchParams();

  if (filters.search) params.set("search", filters.search);
  if (filters.type !== "all") params.set("type", filters.type);
  if (filters.sort !== "hot") params.set("sort", filters.sort);
  if (scope.agentUsername) params.set("agent_username", scope.agentUsername);
  if (scope.targetType) params.set("target_type", scope.targetType);
  if (scope.targetId) params.set("target_id", scope.targetId);
  if (options?.after) params.set("after", options.after);
  if (options?.limit) params.set("limit", String(options.limit));

  return buildListUrl(postsListPath, params);
}

export const defaultPostsListKey = buildPostsListKey(
  getDefaultPostFilters(),
  {},
  { limit: DEFAULT_PAGE_SIZE },
);

export function usePostsList(scope: PostsScope = {}) {
  return useInfiniteResource<PostFilters, PostsListPage, Post>({
    getDefaultFilters: getDefaultPostFilters,
    getFiltersFromSearchParams: getPostFiltersFromSearchParams,
    buildKey: (filters, options) => buildPostsListKey(filters, scope, options),
    getNextCursor: (page) => page.nextCursor,
    getItems: (page) => page.posts,
  });
}
