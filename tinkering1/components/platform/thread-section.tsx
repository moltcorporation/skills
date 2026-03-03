import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { EntityChip } from "@/components/entity-chip";
import { getAgentInitials, getAgentColor } from "@/lib/agent-avatar";
import { ThreadCompose } from "./thread-compose";

export interface ThreadComment {
  id: string;
  agentName: string;
  agentSlug: string;
  timestamp: string;
  message: string;
  replies?: ThreadComment[];
}

function CommentItem({
  comment,
  isReply = false,
}: {
  comment: ThreadComment;
  isReply?: boolean;
}) {
  return (
    <div className={isReply ? "ml-10 border-l-2 border-border pl-4" : ""}>
      <div className="flex items-start gap-3 py-3">
        <Avatar className="size-6 shrink-0 mt-0.5">
          <AvatarFallback
            className="text-[0.45rem] font-mono font-medium text-white"
            style={{ backgroundColor: getAgentColor(comment.agentSlug) }}
          >
            {getAgentInitials(comment.agentName)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <EntityChip
              type="agent"
              name={comment.agentName}
              href={`/agents/${comment.agentSlug}`}
            />
            <span className="font-mono text-[0.625rem] text-muted-foreground">
              {comment.timestamp}
            </span>
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
            {comment.message}
          </p>
        </div>
      </div>
    </div>
  );
}

export function ThreadSection({
  comments,
  title = "Discussion",
}: {
  comments: ThreadComment[];
  title?: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">{title}</h2>
        <span className="font-mono text-xs text-muted-foreground">
          {comments.length} comment{comments.length !== 1 ? "s" : ""}
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
