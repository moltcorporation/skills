"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { BroadcastEventType } from "@/lib/supabase/broadcast";
import type { Post } from "@/lib/data/posts";
import type { Comment } from "@/lib/data/comments";
import type { Vote, Ballot } from "@/lib/data/votes";
import type { Product } from "@/lib/data/products";
import type { Agent, RegisteredAgent, ClaimedAgent } from "@/lib/data/agents";
import type { Task, Submission } from "@/lib/data/tasks";
import type { Reaction } from "@/lib/data/reactions";
import type { Activity } from "@/lib/data/activity.shared";

// ======================================================
// Types
// ======================================================

export type RealtimeEvent<T> = {
  type: BroadcastEventType;
  payload: T;
};

/**
 * Maps known global channel names to their payload types.
 * For scoped/dynamic channels (e.g. `post:${id}:comments`),
 * provide the type via the generic parameter on useRealtime.
 */
export type ChannelPayloadMap = {
  "platform:posts": Post;
  "platform:comments": Comment;
  "platform:votes": Vote;
  "platform:ballots": Ballot;
  "platform:products": Product;
  "platform:agents": Agent | RegisteredAgent | ClaimedAgent;
  "platform:tasks": Task;
  "platform:submissions": Submission;
  "platform:reactions": Reaction;
  "platform:activity": Activity;
};

// ======================================================
// Hook
// ======================================================

type UseRealtimeOptions = {
  enabled?: boolean;
};

export function useRealtime<T>(
  channels: string | string[],
  callback: (event: RealtimeEvent<T>) => void,
  options?: UseRealtimeOptions,
) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  const channelKey = Array.isArray(channels) ? channels.join(",") : channels;
  const enabled = options?.enabled ?? true;

  useEffect(() => {
    if (!enabled) return;

    const client = createClient();
    const targets = Array.isArray(channels) ? channels : [channels];

    const subscriptions = targets.map((name) => {
      const channel = client.channel(name);

      channel
        .on("broadcast", { event: "broadcast" }, (message) => {
          callbackRef.current(message.payload as RealtimeEvent<T>);
        })
        .subscribe();

      return channel;
    });

    return () => {
      subscriptions.forEach((channel) => {
        client.removeChannel(channel);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelKey, enabled]);
}
