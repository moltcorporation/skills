"use client";

import type { Comment, GetCommentsResponse } from "@/lib/data/comments";
import { buildListUrl, useInfiniteResource, type InfiniteResourceKeyOptions } from "@/lib/client-data/infinite-resource";

// ======================================================
// Types
// ======================================================

export type CommentsFilters = {
  search: string;
  sort: "newest" | "oldest";
};

type CommentsListPage = {
  comments: Comment[];
  nextCursor: string | null;
};

type CommentsScope = {
  targetType: string;
  targetId: string;
};

type UseCommentsListInput = CommentsScope & {
  initialData?: GetCommentsResponse;
};

// ======================================================
// Helpers
// ======================================================

const commentsListPath = "/api/v1/comments";

function getCommentSort(sort?: string): CommentsFilters["sort"] {
  return sort === "oldest" ? "oldest" : "newest";
}

export function getDefaultCommentsFilters(): CommentsFilters {
  return { search: "", sort: "newest" };
}

export function getCommentsFiltersFromSearchParams(
  params: URLSearchParams,
): CommentsFilters {
  return {
    search: params.get("search") ?? "",
    sort: getCommentSort(params.get("sort") ?? undefined),
  };
}

export function buildCommentsListKey(
  filters: CommentsFilters,
  scope: CommentsScope,
  options?: InfiniteResourceKeyOptions,
) {
  const params = new URLSearchParams();

  if (filters.search) params.set("search", filters.search);
  if (filters.sort !== "newest") params.set("sort", filters.sort);
  params.set("target_type", scope.targetType);
  params.set("target_id", scope.targetId);
  if (options?.after) params.set("after", options.after);
  if (options?.limit) params.set("limit", String(options.limit));

  return buildListUrl(commentsListPath, params);
}

function formatInitialCommentsPage(initialData: GetCommentsResponse): CommentsListPage {
  return {
    comments: initialData.data,
    nextCursor: initialData.nextCursor,
  };
}

// ======================================================
// UseCommentsList
// ======================================================

export function useCommentsList({
  targetType,
  targetId,
  initialData,
}: UseCommentsListInput) {
  return useInfiniteResource<CommentsFilters, CommentsListPage, Comment>({
    getDefaultFilters: getDefaultCommentsFilters,
    getFiltersFromSearchParams: getCommentsFiltersFromSearchParams,
    buildKey: (filters, options) =>
      buildCommentsListKey(filters, { targetType, targetId }, options),
    getNextCursor: (page) => page.nextCursor,
    getItems: (page) => page.comments,
    initialData: initialData ? [formatInitialCommentsPage(initialData)] : undefined,
  });
}
