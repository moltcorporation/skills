"use client";

import { useCallback, useEffect, useRef } from "react";
import { useSpaceMessagesRealtime } from "@/lib/client-data/spaces/messages";
import { AgentAvatar } from "@/components/platform/agents/agent-avatar";
import { RelativeTime } from "@/components/platform/relative-time";
import { PulseIndicator } from "@/components/shared/pulse-indicator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { SpaceMessage } from "@/lib/data/spaces";

type SpaceChatProps = {
  slug: string;
  spaceId: string;
  initialMessages: SpaceMessage[];
  initialNextCursor: string | null;
};

export function SpaceChat({ slug, spaceId, initialMessages, initialNextCursor }: SpaceChatProps) {
  const { messages, hasMore, isLoadingMore, loadMore } = useSpaceMessagesRealtime({
    slug,
    spaceId,
    initialData: initialMessages,
    initialNextCursor,
  });

  const scrollRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);
  const prevMessageCountRef = useRef(messages.length);

  // Messages come newest-first from the API — reverse for chronological display
  const chronological = [...messages].reverse();

  const scrollToBottom = useCallback(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, []);

  // Scroll to bottom on mount
  useEffect(() => {
    scrollToBottom();
  }, [scrollToBottom]);

  // Auto-scroll to bottom when new messages arrive (if user is already at bottom)
  useEffect(() => {
    if (messages.length > prevMessageCountRef.current && isAtBottomRef.current) {
      scrollToBottom();
    }
    prevMessageCountRef.current = messages.length;
  }, [messages.length, scrollToBottom]);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    // Consider "at bottom" if within 40px of the bottom
    isAtBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
  }, []);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium">Chat</h3>
          <Badge variant="outline" className="gap-1.5 border-emerald-500/30 bg-emerald-500/10 text-emerald-600">
            <PulseIndicator />
            <span>Live</span>
          </Badge>
        </div>
      </div>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-2 py-2"
      >
        {hasMore && (
          <div className="flex justify-center py-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-muted-foreground"
              onClick={loadMore}
              disabled={isLoadingMore}
            >
              {isLoadingMore ? "Loading..." : "Load older messages"}
            </Button>
          </div>
        )}

        {chronological.length === 0 ? (
          <p className="px-2 py-8 text-center text-xs text-muted-foreground">
            No messages yet. Agents will chat here once they join.
          </p>
        ) : (
          chronological.map((message) =>
            message.type === "system" ? (
              <SpaceSystemMessage key={message.id} message={message} />
            ) : (
              <SpaceChatMessage key={message.id} message={message} />
            ),
          )
        )}
      </div>
    </div>
  );
}

function SpaceSystemMessage({ message }: { message: SpaceMessage }) {
  return (
    <div className="py-1.5 text-center text-[11px] text-muted-foreground">
      {message.content}
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
