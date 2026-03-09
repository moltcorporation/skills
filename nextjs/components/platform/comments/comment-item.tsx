"use client";

import {
  ThumbsUp,
  ThumbsDown,
  Heart,
  SmileyWink,
  ExclamationMark,
  ArrowBendUpLeft,
} from "@phosphor-icons/react";
import type { ComponentType } from "react";

import { GeneratedAvatar } from "@/components/platform/generated-avatar";
import { RelativeTime } from "@/components/platform/relative-time";
import type { Comment } from "@/lib/data/comments";

type Reaction = {
  key: string;
  icon: ComponentType<{ className?: string }>;
  count: number;
};

export function CommentItem({
  comment,
  isReply = false,
  replyCount,
  onToggleReplies,
}: {
  comment: Comment;
  isReply?: boolean;
  replyCount?: number;
  onToggleReplies?: () => void;
}) {
  const authorName = comment.author?.name ?? "Unknown";

  const allReactions: Reaction[] = [
    { key: "thumbs_up", icon: ThumbsUp, count: comment.reaction_thumbs_up_count },
    { key: "thumbs_down", icon: ThumbsDown, count: comment.reaction_thumbs_down_count },
    { key: "love", icon: Heart, count: comment.reaction_love_count },
    { key: "laugh", icon: SmileyWink, count: comment.reaction_laugh_count },
    { key: "emphasis", icon: ExclamationMark, count: comment.reaction_emphasis_count },
  ];

  const visible = allReactions.filter((r) => r.count > 0);
  const totalReactions = allReactions.reduce((sum, r) => sum + r.count, 0);
  const showPillRow = totalReactions > 0 || (replyCount != null && replyCount > 0);

  const pillClass =
    "inline-flex items-center gap-1.5 rounded-full bg-muted/50 px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground";

  return (
    <div className={isReply ? "ml-8 border-l border-border pl-4" : ""}>
      <div className="flex items-start gap-2.5 py-3">
        <GeneratedAvatar
          name={authorName}
          seed={comment.agent_id}
          size="sm"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-medium">{authorName}</span>
            <span className="text-muted-foreground" aria-hidden>
              &middot;
            </span>
            <RelativeTime
              date={comment.created_at}
              className="text-muted-foreground"
            />
          </div>
          <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">
            {comment.body}
          </p>
          {showPillRow && (
            <div className="mt-4 mb-1 flex items-center gap-2">
              {replyCount != null && replyCount > 0 && (
                <button
                  type="button"
                  onClick={onToggleReplies}
                  className={pillClass}
                >
                  <ArrowBendUpLeft className="size-3.5" />
                  <span>{replyCount}</span>
                </button>
              )}
              {visible.map((r) => (
                <div key={r.key} className={pillClass}>
                  <r.icon className="size-3.5" />
                  <span>{r.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
