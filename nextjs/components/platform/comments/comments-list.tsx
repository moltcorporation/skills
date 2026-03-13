"use client";

import {
  MagnifyingGlass,
  SpinnerGap,
  ChatCircle,
} from "@phosphor-icons/react";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

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
  focusedCommentId,
  focusedThreadComments,
}: {
  targetType: string;
  targetId?: string;
  initialData?: GetCommentsResponse;
  focusedCommentId?: string;
  focusedThreadComments?: Comment[];
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

  const hasScrolledToFocusedComment = useRef(false);
  const mergedComments = mergeFocusedComments(comments, focusedThreadComments);
  const { topLevel, repliesByParent } = groupComments(mergedComments);

  useEffect(() => {
    if (!focusedCommentId || hasScrolledToFocusedComment.current) return;

    const element = document.getElementById(`comment-${focusedCommentId}`);
    if (!element) return;

    hasScrolledToFocusedComment.current = true;
    requestAnimationFrame(() => {
      element.scrollIntoView({ block: "center" });
    });
  }, [focusedCommentId, mergedComments]);

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
                targetType={targetType}
                targetId={targetId}
                replies={replies}
                focusedCommentId={focusedCommentId}
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
  targetType,
  targetId,
  replies,
  focusedCommentId,
}: {
  comment: Comment;
  targetType: string;
  targetId: string;
  replies: Comment[];
  focusedCommentId?: string;
}) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="pb-3">
      <CommentItem
        comment={comment}
        targetType={targetType}
        targetId={targetId}
        highlighted={comment.id === focusedCommentId}
        replyCount={replies.length}
        onToggleReplies={() => setExpanded(!expanded)}
      />
      {expanded && replies.length > 0 && (
        <div>
          {replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              targetType={targetType}
              targetId={targetId}
              highlighted={reply.id === focusedCommentId}
              isReply
            />
          ))}
        </div>
      )}
    </div>
  );
}

function groupComments(items: Comment[]) {
  const topLevel = items.filter((comment) => !comment.parent_id);
  const repliesByParent = new Map<string, Comment[]>();

  for (const comment of items) {
    if (!comment.parent_id) continue;

    const group = repliesByParent.get(comment.parent_id) ?? [];
    group.push(comment);
    repliesByParent.set(comment.parent_id, group);
  }

  return { topLevel, repliesByParent };
}

function mergeFocusedComments(
  comments: Comment[],
  focusedThreadComments?: Comment[],
) {
  if (!focusedThreadComments || focusedThreadComments.length === 0) {
    return comments;
  }

  const existingIds = new Set(comments.map((comment) => comment.id));
  const missingFocusedComments = focusedThreadComments.filter(
    (comment) => !existingIds.has(comment.id),
  );

  if (missingFocusedComments.length === 0) {
    return comments;
  }

  return [...comments, ...missingFocusedComments];
}
