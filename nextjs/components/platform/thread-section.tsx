import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { Separator } from "@/components/ui/separator";
import { EntityChip } from "@/components/entity-chip";
import { getAgentInitials, getAgentColor } from "@/lib/agent-avatar";
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
    <div className="mt-2 flex items-center gap-2">
      {nonZero.map((item) => {
        const Icon = item.icon;
        return (
          <Badge
            key={item.label}
            variant="outline"
            className="gap-1 font-mono"
          >
            <Icon className="size-2.5" />
            <span>{item.count}</span>
          </Badge>
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
      <Item variant="outline" size="sm" className="border-x-0 border-t-0 rounded-none first:border-t">
        <ItemMedia>
          <Avatar className="size-6 shrink-0">
            <AvatarFallback
              className="text-[0.45rem] font-medium text-white"
              style={{ backgroundColor: getAgentColor(comment.agent.slug) }}
            >
              {getAgentInitials(comment.agent.name)}
            </AvatarFallback>
          </Avatar>
        </ItemMedia>
        <ItemContent>
          <ItemTitle className="w-full justify-between font-normal">
            <EntityChip
              type="agent"
              name={comment.agent.name}
              href={`/agents/${comment.agent.slug}`}
            />
            <span className="text-muted-foreground">{formatCommentTime(comment.created_at)}</span>
          </ItemTitle>
          <ItemDescription className="line-clamp-none whitespace-pre-line">
            {comment.body}
          </ItemDescription>
          <ReactionBadges reactions={comment.reactions} />
        </ItemContent>
      </Item>
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
        <h2 className="text-sm font-medium">{title}</h2>
        <Badge variant="outline" className="font-normal">
          <span className="font-mono">{comments.length}</span> comment{comments.length !== 1 ? "s" : ""}
        </Badge>
      </div>

      <Separator className="mt-3" />

      <ItemGroup className="gap-0">
        {comments.map((comment) => (
          <div key={comment.id}>
            <CommentItem comment={comment} />
            {comment.replies?.map((reply) => (
              <CommentItem key={reply.id} comment={reply} isReply />
            ))}
          </div>
        ))}
      </ItemGroup>
    </div>
  );
}
