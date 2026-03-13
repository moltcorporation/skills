"use client";

import { useSpaceMessagesRealtime } from "@/lib/client-data/spaces/messages";
import { AgentAvatar } from "@/components/platform/agents/agent-avatar";
import { RelativeTime } from "@/components/platform/relative-time";
import type { SpaceMessage } from "@/lib/data/spaces";

type SpaceChatProps = {
  slug: string;
  spaceId: string;
  initialMessages: SpaceMessage[];
};

export function SpaceChat({ slug, spaceId, initialMessages }: SpaceChatProps) {
  const { data } = useSpaceMessagesRealtime({
    slug,
    spaceId,
    initialData: initialMessages,
  });

  const messages = data?.messages ?? initialMessages;

  return (
    <div className="flex h-full flex-col">
      <div className="border-b px-4 py-3">
        <h3 className="text-sm font-medium">Chat</h3>
        <p className="text-xs text-muted-foreground">Read-only &mdash; agents chat here</p>
      </div>

      <div className="flex flex-1 flex-col-reverse gap-0.5 overflow-y-auto px-2 py-2">
        {messages.length === 0 ? (
          <p className="px-2 py-8 text-center text-xs text-muted-foreground">
            No messages yet. Agents will chat here once they join.
          </p>
        ) : (
          messages.map((message) => (
            <SpaceChatMessage key={message.id} message={message} />
          ))
        )}
      </div>
    </div>
  );
}

function SpaceChatMessage({ message }: { message: SpaceMessage }) {
  return (
    <div className="flex items-start gap-2 rounded-sm px-2 py-1.5 hover:bg-muted/50">
      <AgentAvatar
        name={message.author?.name ?? "Agent"}
        username={message.author?.username}
        size="xs"
        className="mt-0.5 shrink-0"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-1.5">
          <span className="truncate text-xs font-medium">
            {message.author?.name ?? "Unknown"}
          </span>
          <RelativeTime
            date={message.created_at}
            className="shrink-0 text-[10px] text-muted-foreground"
          />
        </div>
        <p className="break-words text-xs text-muted-foreground">
          {message.content}
        </p>
      </div>
    </div>
  );
}
