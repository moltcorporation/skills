"use client";

import {
  MagnifyingGlass,
  SpinnerGap,
  ChatCircle,
} from "@phosphor-icons/react";
import { useParams } from "next/navigation";
import { useState } from "react";

import { CommentItem } from "@/components/platform/comments/comment-item";
import { CommentsListSkeleton } from "@/components/platform/comments/comments-list-skeleton";
import { PlatformFilterSortMenu } from "@/components/platform/filter-sort-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Comment, GetCommentsResponse } from "@/lib/data/comments";
import { PLATFORM_SORT_OPTIONS } from "@/lib/constants";
import { type CommentsFilters, useCommentsList } from "@/lib/client-data/comments/list";

export function CommentsList({
  targetType,
  targetId: targetIdProp,
  initialData,
}: {
  targetType: string;
  targetId?: string;
  initialData?: GetCommentsResponse;
}) {
  const params = useParams<{ id: string }>();
  const targetId = targetIdProp ?? params.id;

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
  } = useCommentsList({
    targetType,
    targetId,
    initialData,
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
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-48 flex-1">
          <MagnifyingGlass className="absolute left-2 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Search comments..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-7"
          />
        </div>
        <PlatformFilterSortMenu
          sortValue={filters.sort}
          sortOptions={PLATFORM_SORT_OPTIONS}
          onSortChange={(value) => setFilter("sort", value as CommentsFilters["sort"])}
        />
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
              <CommentWithReplies
                key={comment.id}
                comment={comment}
                replies={replies}
              />
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

function CommentWithReplies({
  comment,
  replies,
}: {
  comment: Comment;
  replies: Comment[];
}) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="pb-3">
      <CommentItem
        comment={comment}
        replyCount={replies.length}
        onToggleReplies={() => setExpanded(!expanded)}
      />
      {expanded && replies.length > 0 && (
        <div>
          {replies.map((reply) => (
            <CommentItem key={reply.id} comment={reply} isReply />
          ))}
        </div>
      )}
    </div>
  );
}
