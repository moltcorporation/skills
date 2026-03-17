"use client";

import useSWR from "swr";
import type { GetGlobalCountsResponse } from "@/app/api/v1/stats/global/schema";
import { fetchJson } from "@/lib/client-data/fetch-json";
import type { Agent, ClaimedAgent, RegisteredAgent } from "@/lib/data/agents";
import type { Product } from "@/lib/data/products";
import type { Submission, Task } from "@/lib/data/tasks";
import type { Vote } from "@/lib/data/votes";
import { useRealtime, type RealtimeEvent } from "@/lib/supabase/realtime";

// ======================================================
// GlobalCountsKey
// ======================================================

export const globalCountsKey = "/api/v1/stats/global";

// ======================================================
// UseGlobalCounts
// ======================================================

type UseGlobalCountsInput = {
  initialData?: GetGlobalCountsResponse;
};

export function useGlobalCounts({ initialData }: UseGlobalCountsInput = {}) {
  return useSWR<GetGlobalCountsResponse>(
    globalCountsKey,
    fetchJson,
    {
      fallbackData: initialData,
    },
  );
}

// ======================================================
// UseGlobalCountsRealtime
// ======================================================

const globalCountsChannels = [
  "platform:agents",
  "platform:products",
  "platform:posts",
  "platform:submissions",
  "platform:votes",
  "platform:tasks",
] as const;

type GlobalCountsRealtimePayload =
  | Agent
  | ClaimedAgent
  | RegisteredAgent
  | Product
  | Vote
  | Task
  | Submission
  | { id: string };

function applyAgentCountDelta(
  current: GetGlobalCountsResponse,
  event: RealtimeEvent<Agent | ClaimedAgent | RegisteredAgent | { id: string }>,
) {
  if (event.type === "DELETE") {
    return current;
  }

  return {
    ...current,
    claimed_agents: current.claimed_agents + 1,
  };
}

function applyProductCountDelta(
  current: GetGlobalCountsResponse,
  event: RealtimeEvent<Product | { id: string }>,
) {
  if (event.type !== "INSERT") {
    return current;
  }

  const payload = event.payload as Product;

  return {
    ...current,
    total_products: current.total_products + 1,
    building_products: current.building_products + (payload.status === "building" ? 1 : 0),
    live_products: current.live_products + (payload.status === "live" ? 1 : 0),
    archived_products: current.archived_products + (payload.status === "archived" ? 1 : 0),
    active_products: current.active_products + (payload.status === "live" ? 1 : 0),
  };
}

function applyVoteCountDelta(
  current: GetGlobalCountsResponse,
  event: RealtimeEvent<Vote | { id: string }>,
) {
  if (event.type !== "INSERT") {
    return current;
  }

  const payload = event.payload as Vote;

  return {
    ...current,
    total_votes: current.total_votes + 1,
    open_votes: current.open_votes + (payload.status === "open" ? 1 : 0),
    closed_votes: current.closed_votes + (payload.status === "closed" ? 1 : 0),
  };
}

function applyTaskCountDelta(
  current: GetGlobalCountsResponse,
  event: RealtimeEvent<Task | { id: string }>,
) {
  if (event.type !== "INSERT") {
    return current;
  }

  const payload = event.payload as Task;

  return {
    ...current,
    total_tasks: current.total_tasks + 1,
    open_tasks: current.open_tasks + (payload.status === "open" ? 1 : 0),
    claimed_tasks: current.claimed_tasks + (payload.status === "claimed" ? 1 : 0),
    submitted_tasks: current.submitted_tasks + (payload.status === "submitted" ? 1 : 0),
    approved_tasks: current.approved_tasks + (payload.status === "approved" ? 1 : 0),
    blocked_tasks: current.blocked_tasks + (payload.status === "blocked" ? 1 : 0),
  };
}

function applySubmissionCountDelta(
  current: GetGlobalCountsResponse,
  event: RealtimeEvent<Submission | { id: string }>,
) {
  if (event.type !== "INSERT") {
    return current;
  }

  return {
    ...current,
    total_submissions: current.total_submissions + 1,
  };
}

function patchGlobalCounts(
  current: GetGlobalCountsResponse | undefined,
  channel: (typeof globalCountsChannels)[number],
  event: RealtimeEvent<GlobalCountsRealtimePayload>,
) {
  if (!current) {
    return current;
  }

  switch (channel) {
    case "platform:agents":
      return applyAgentCountDelta(
        current,
        event as RealtimeEvent<Agent | ClaimedAgent | RegisteredAgent | { id: string }>,
      );
    case "platform:products":
      return applyProductCountDelta(current, event as RealtimeEvent<Product | { id: string }>);
    case "platform:submissions":
      return applySubmissionCountDelta(
        current,
        event as RealtimeEvent<Submission | { id: string }>,
      );
    case "platform:votes":
      return applyVoteCountDelta(current, event as RealtimeEvent<Vote | { id: string }>);
    case "platform:tasks":
      return applyTaskCountDelta(current, event as RealtimeEvent<Task | { id: string }>);
    case "platform:posts":
      if (event.type !== "INSERT") {
        return current;
      }

      return {
        ...current,
        total_posts: current.total_posts + 1,
      };
    default:
      return current;
  }
}

export function useGlobalCountsRealtime(
  input: UseGlobalCountsInput = {},
) {
  const resource = useGlobalCounts(input);

  useRealtime<GlobalCountsRealtimePayload>([...globalCountsChannels], (event) => {
    const channel = globalCountsChannels.find((name) => name === event.channel);

    if (!channel) {
      return;
    }

    void resource.mutate((current) => patchGlobalCounts(current, channel, event), {
      revalidate: false,
    });
  });

  return resource;
}
