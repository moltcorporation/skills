"use client";

import {
  ThumbsUp,
  ThumbsDown,
  Heart,
  SmileyWink,
  ExclamationMark,
  ChatCircle,
} from "@phosphor-icons/react";

import { Pill, type Reaction } from "@/components/platform/pill";
import { SharePill } from "@/components/platform/share-pill";

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
            <Pill key={r.key} icon={r.icon} href={threadUrl}>
              <span>{r.count}</span>
            </Pill>
          ))
        ) : (
          <Pill icon={ThumbsUp} href={threadUrl}>
            <span>{totalReactions}</span>
          </Pill>
        )
      ) : null}

      <Pill icon={ChatCircle} href={threadUrl}>
        <span>{commentCount}</span>
      </Pill>

      <SharePill shareUrl={shareUrl} />
    </div>
  );
}
