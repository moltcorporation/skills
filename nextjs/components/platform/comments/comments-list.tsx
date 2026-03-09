"use client";

import {
  MagnifyingGlass,
  SpinnerGap,
  ChatCircle,
  SortAscending,
  SortDescending,
} from "@phosphor-icons/react";

import { CommentItem } from "@/components/platform/comments/comment-item";
import {
  buildCommentsSearchParams,
  getCommentsFiltersFromSearchParams,
  type CommentsFilters,
} from "@/components/platform/comments/comments-list-shared";
import { CommentsListSkeleton } from "@/components/platform/comments/comments-list-skeleton";
import { usePlatformInfiniteList } from "@/components/platform/use-platform-infinite-list";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Comment, GetCommentsResponse } from "@/lib/data/comments";

type ApiResponse = {
  comments: Comment[];
  hasMore: boolean;
};

function formatAsApiResponse(page: GetCommentsResponse): ApiResponse {
  return { comments: page.data, hasMore: page.hasMore };
}

export function CommentsList({
  targetType,
  targetId,
  initialPage,
}: {
  targetType: string;
  targetId: string;
  initialPage: GetCommentsResponse;
}) {
  const {
    filters,
    items: comments,
    searchInput,
    setFilter,
    setSearchInput,
    error,
    hasMore,
    isLoading,
    isLoadingMore,
    loadMore,
  } = usePlatformInfiniteList<CommentsFilters, ApiResponse, Comment>({
    apiPath: "/api/v1/comments",
    defaultFilters: { search: "", sort: "oldest" },
    getCursor: (comment) => comment.id,
    getHasMore: (page) => page.hasMore,
    getItems: (page) => page.comments,
    getFiltersFromSearchParams: getCommentsFiltersFromSearchParams,
    buildSearchParams: (activeFilters, options) => {
      const params = buildCommentsSearchParams(activeFilters, options);
      params.set("target_type", targetType);
      params.set("target_id", targetId);
      return params;
    },
    initialPages: [formatAsApiResponse(initialPage)],
    syncUrl: false,
  });

  // Group comments: top-level first, replies nested under parent
  const topLevel = comments.filter((c) => !c.parent_id);
  const repliesByParent = new Map<string, Comment[]>();
  for (const c of comments) {
    if (c.parent_id) {
      const group = repliesByParent.get(c.parent_id) ?? [];
      group.push(c);
      repliesByParent.set(c.parent_id, group);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            setFilter(
              "sort",
              filters.sort === "oldest" ? "newest" : "oldest",
            )
          }
        >
          {filters.sort === "oldest" ? (
            <SortAscending className="size-3.5" />
          ) : (
            <SortDescending className="size-3.5" />
          )}
          {filters.sort === "oldest" ? "Oldest first" : "Newest first"}
        </Button>
        <div className="relative min-w-48 flex-1">
          <MagnifyingGlass className="absolute left-2 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Search comments..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-7"
          />
        </div>
      </div>

      {error && comments.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          Unable to load comments right now.
        </p>
      ) : isLoading && comments.length === 0 ? (
        <CommentsListSkeleton />
      ) : comments.length === 0 ? (
        <div className="py-10 text-center text-sm text-muted-foreground">
          <ChatCircle className="mx-auto mb-2 size-5 text-muted-foreground/50" />
          No comments yet.
        </div>
      ) : (
        <div className="divide-y divide-border">
          {topLevel.map((comment) => {
            const replies = repliesByParent.get(comment.id) ?? [];
            return (
              <div key={comment.id}>
                <CommentItem comment={comment} />
                {replies.map((reply) => (
                  <CommentItem key={reply.id} comment={reply} isReply />
                ))}
              </div>
            );
          })}
        </div>
      )}

      {hasMore && (
        <div className="flex justify-center pt-2">
          <Button variant="outline" onClick={loadMore} disabled={isLoadingMore}>
            {isLoadingMore ? <SpinnerGap className="animate-spin" /> : null}
            Load more
          </Button>
        </div>
      )}
    </div>
  );
}

