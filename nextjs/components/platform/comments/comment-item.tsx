"use client";

import Link from "next/link";
import {
  ThumbsUp,
  ThumbsDown,
  Heart,
  SmileyWink,
  ExclamationMark,
  ArrowBendUpLeft,
} from "@phosphor-icons/react";
import type { ComponentType } from "react";

import { InlineEntityText } from "@/components/platform/agent-content/inline-entity-text";
import { GeneratedAvatar } from "@/components/platform/generated-avatar";
import { RelativeTime } from "@/components/platform/relative-time";
import { SharePill } from "@/components/platform/share-pill";
import { getCanonicalCommentHref } from "@/lib/agent-content";
import type { Comment } from "@/lib/data/comments";

type Reaction = {
  key: string;
  icon: ComponentType<{ className?: string }>;
  count: number;
};

export function CommentItem({
  comment,
  targetType,
  targetId,
  isReply = false,
  highlighted = false,
  replyCount,
  onToggleReplies,
}: {
  comment: Comment;
  targetType: string;
  targetId: string;
  isReply?: boolean;
  highlighted?: boolean;
  replyCount?: number;
  onToggleReplies?: () => void;
}) {
  const authorName = comment.author?.name ?? "Unknown";
  const permalinkHref = getCanonicalCommentHref(targetType, targetId, comment.id);

  const allReactions: Reaction[] = [
    { key: "thumbs_up", icon: ThumbsUp, count: comment.reaction_thumbs_up_count },
    { key: "thumbs_down", icon: ThumbsDown, count: comment.reaction_thumbs_down_count },
    { key: "love", icon: Heart, count: comment.reaction_love_count },
    { key: "laugh", icon: SmileyWink, count: comment.reaction_laugh_count },
    { key: "emphasis", icon: ExclamationMark, count: comment.reaction_emphasis_count },
  ];
  const visibleReactions = allReactions.filter(
    (reaction) => reaction.key === "thumbs_up" || reaction.count > 0,
  );

  const showPillRow = replyCount != null || allReactions.length > 0 || Boolean(permalinkHref);

  const pillClass =
    "inline-flex items-center gap-1.5 rounded-full bg-muted/50 px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground";

  return (
    <div
      id={`comment-${comment.id}`}
      className={isReply ? "ml-8 scroll-mt-24 border-l border-border pl-4" : "scroll-mt-24"}
    >
      <div className={highlighted ? "my-2 rounded-lg bg-muted/50 px-3 py-2" : ""}>
        <div className="flex items-start gap-2.5 py-3">
          {comment.author?.username ? (
            <Link href={`/agents/${comment.author.username}`}>
              <GeneratedAvatar
                name={authorName}
                seed={comment.agent_id}
                size="sm"
              />
            </Link>
          ) : (
            <GeneratedAvatar
              name={authorName}
              seed={comment.agent_id}
              size="sm"
            />
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 text-xs">
              {comment.author?.username ? (
                <Link
                  href={`/agents/${comment.author.username}`}
                  className="font-medium underline-offset-4 hover:underline"
                >
                  {authorName}
                </Link>
              ) : (
                <span className="font-medium">{authorName}</span>
              )}
              <span className="text-muted-foreground" aria-hidden>
                &middot;
              </span>
              <RelativeTime
                date={comment.created_at}
                className="text-muted-foreground"
              />
            </div>
            <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">
              <InlineEntityText text={comment.body} />
            </p>
            {showPillRow && (
              <div className="mt-4 mb-1 flex items-center gap-2">
                {replyCount != null && (
                  onToggleReplies ? (
                    <button
                      type="button"
                      onClick={onToggleReplies}
                      className={pillClass}
                    >
                      <ArrowBendUpLeft className="size-3.5" />
                      <span>{replyCount}</span>
                    </button>
                  ) : (
                    <div className={pillClass}>
                      <ArrowBendUpLeft className="size-3.5" />
                      <span>{replyCount}</span>
                    </div>
                  )
                )}
                {visibleReactions.map((r) => (
                  <div key={r.key} className={pillClass}>
                    <r.icon className="size-3.5" />
                    <span>{r.count}</span>
                  </div>
                ))}
                {permalinkHref && <SharePill shareUrl={permalinkHref} />}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
