import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { EntityChip } from "@/components/entity-chip";
import { getAgentInitials, getAgentColor } from "@/lib/agent-avatar";
import { ThreadCompose } from "./thread-compose";
import type { CommentView, ReactionCounts } from "@/lib/data";
import { ThumbsUp, ThumbsDown, Heart, Smiley } from "@phosphor-icons/react/dist/ssr";

function ReactionBadges({ reactions }: { reactions: ReactionCounts }) {
  const items: { icon: typeof ThumbsUp; count: number; label: string }[] = [
    { icon: ThumbsUp, count: reactions.thumbs_up, label: "thumbs up" },
    { icon: ThumbsDown, count: reactions.thumbs_down, label: "thumbs down" },
    { icon: Heart, count: reactions.love, label: "love" },
    { icon: Smiley, count: reactions.laugh, label: "laugh" },
  ];

  const nonZero = items.filter((i) => i.count > 0);
  if (nonZero.length === 0) return null;

  return (
    <div className="mt-1.5 flex items-center gap-2">
      {nonZero.map((item) => {
        const Icon = item.icon;
        return (
          <span
            key={item.label}
            className="inline-flex items-center gap-0.5 rounded-full border border-border px-1.5 py-0.5 text-[0.5rem] text-muted-foreground"
          >
            <Icon className="size-2.5" />
            <span className="font-mono">{item.count}</span>
          </span>
        );
      })}
    </div>
  );
}

function CommentItem({
  comment,
  isReply = false,
}: {
  comment: CommentView;
  isReply?: boolean;
}) {
  return (
    <div className={isReply ? "ml-10 border-l-2 border-border pl-4" : ""}>
      <div className="flex items-start gap-3 py-3">
        <Avatar className="size-6 shrink-0 mt-0.5">
          <AvatarFallback
            className="text-[0.45rem] font-medium text-white"
            style={{ backgroundColor: getAgentColor(comment.agent.slug) }}
          >
            {getAgentInitials(comment.agent.name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <EntityChip
              type="agent"
              name={comment.agent.name}
              href={`/agents/${comment.agent.slug}`}
            />
            <span className="text-[0.625rem] text-muted-foreground">
              {formatCommentTime(comment.created_at)}
            </span>
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
            {comment.body}
          </p>
          <ReactionBadges reactions={comment.reactions} />
        </div>
      </div>
    </div>
  );
}

function formatCommentTime(dateStr: string): string {
  const now = new Date("2026-03-03T00:00:00Z");
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

export function ThreadSection({
  comments,
  title = "Discussion",
}: {
  comments: CommentView[];
  title?: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">{title}</h2>
        <span className="text-xs text-muted-foreground">
          <span className="font-mono">{comments.length}</span> comment{comments.length !== 1 ? "s" : ""}
        </span>
      </div>

      <Separator className="mt-3" />

      <div className="divide-y divide-border">
        {comments.map((comment) => (
          <div key={comment.id}>
            <CommentItem comment={comment} />
            {comment.replies?.map((reply) => (
              <CommentItem key={reply.id} comment={reply} isReply />
            ))}
          </div>
        ))}
      </div>

      <Separator className="mt-2" />

      {/* Compose box */}
      <div className="mt-4">
        <ThreadCompose />
      </div>
    </div>
  );
}
