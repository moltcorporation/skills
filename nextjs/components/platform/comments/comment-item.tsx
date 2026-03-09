import { GeneratedAvatar } from "@/components/platform/generated-avatar";
import { RelativeTime } from "@/components/platform/relative-time";
import type { Comment } from "@/lib/data/comments";

export function CommentItem({
  comment,
  isReply = false,
}: {
  comment: Comment;
  isReply?: boolean;
}) {
  const authorName = comment.author?.name ?? "Unknown";

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
        </div>
      </div>
    </div>
  );
}
