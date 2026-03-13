"use client";

import Link from "next/link";
import {
  ThumbsUp,
  ThumbsDown,
  Heart,
  SmileyWink,
  ExclamationMark,
  ChatCircle,
} from "@phosphor-icons/react";
import type { ComponentType } from "react";

import { SharePill } from "@/components/platform/share-pill";

type Reaction = {
  key: string;
  icon: ComponentType<{ className?: string }>;
  count: number;
};

type ReactionCounts = {
  thumbs_up: number;
  thumbs_down: number;
  love: number;
  laugh: number;
  emphasis: number;
};

export function EntityCardActions({
  shareUrl,
  threadUrl,
  reactions,
  commentCount,
}: {
  shareUrl: string;
  threadUrl?: string;
  reactions?: ReactionCounts;
  commentCount: number;
}) {
  const pillClass =
    "inline-flex items-center gap-1.5 rounded-full bg-muted/50 px-3 py-1 text-xs text-muted-foreground";
  const interactivePillClass =
    "inline-flex items-center gap-1.5 rounded-full bg-muted/50 px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground";

  const allReactions: Reaction[] | null = reactions
    ? [
        { key: "thumbs_up", icon: ThumbsUp, count: reactions.thumbs_up },
        { key: "thumbs_down", icon: ThumbsDown, count: reactions.thumbs_down },
        { key: "love", icon: Heart, count: reactions.love },
        { key: "laugh", icon: SmileyWink, count: reactions.laugh },
        { key: "emphasis", icon: ExclamationMark, count: reactions.emphasis },
      ]
    : null;

  const visible = allReactions?.filter((r) => r.count > 0) ?? [];
  const totalReactions = allReactions?.reduce((sum, r) => sum + r.count, 0) ?? 0;

  return (
    <div className="relative z-10 flex items-center gap-2">
      {allReactions ? (
        visible.length > 0 ? (
          visible.map((r) => (
            threadUrl ? (
              <Link key={r.key} href={threadUrl} className={interactivePillClass}>
                <r.icon className="size-3.5" />
                <span>{r.count}</span>
              </Link>
            ) : (
              <div key={r.key} className={pillClass}>
                <r.icon className="size-3.5" />
                <span>{r.count}</span>
              </div>
            )
          ))
        ) : (
          threadUrl ? (
            <Link href={threadUrl} className={interactivePillClass}>
              <ThumbsUp className="size-3.5" />
              <span>{totalReactions}</span>
            </Link>
          ) : (
            <div className={pillClass}>
              <ThumbsUp className="size-3.5" />
              <span>{totalReactions}</span>
            </div>
          )
        )
      ) : null}

      {threadUrl ? (
        <Link href={threadUrl} className={interactivePillClass}>
          <ChatCircle className="size-3.5" />
          <span>{commentCount}</span>
        </Link>
      ) : (
        <div className={pillClass}>
          <ChatCircle className="size-3.5" />
          <span>{commentCount}</span>
        </div>
      )}

      <SharePill shareUrl={shareUrl} />
    </div>
  );
}
