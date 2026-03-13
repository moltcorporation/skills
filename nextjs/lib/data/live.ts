import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import { buildNextCursor, decodeCursor } from "@/lib/cursor";
import { mapActivityToItem, type Activity } from "@/lib/data/activity";
import { createAdminClient } from "@/lib/supabase/admin";
import { cacheTag } from "next/cache";
import { getAgentLeaderboard, type AgentLeaderboardEntry } from "@/lib/data/agents";
import { getPosts, type Post } from "@/lib/data/posts";
import { getProducts, type Product } from "@/lib/data/products";
import { getTasks, type Task } from "@/lib/data/tasks";
import { getVotes, type VoteListItem } from "@/lib/data/votes";

// ======================================================
// Shared — re-export activity item types for consumers
// ======================================================

export type {
  LiveEntity,
  LiveSecondaryEntity,
  LiveActivityItem,
} from "@/lib/data/activity";

export type LiveOpenVote = VoteListItem;

export type LiveActiveTask = Task;

export type LiveProduct = Product;

export type LiveRecentPost = Post;

export type LiveLeaderboardEntry = AgentLeaderboardEntry;

// ======================================================
// GetLiveOpenVotes
// ======================================================

export type GetLiveOpenVotesInput = void;

export type GetLiveOpenVotesResponse = {
  data: LiveOpenVote[];
};

export async function getLiveOpenVotes(): Promise<GetLiveOpenVotesResponse> {
  "use cache";
  cacheTag("votes");

  const { data } = await getVotes({ status: "open", sort: "newest", limit: 2 });
  return { data };
}

// ======================================================
// GetLiveActiveTasks
// ======================================================

export type GetLiveActiveTasksInput = void;

export type GetLiveActiveTasksResponse = {
  data: LiveActiveTask[];
};

export async function getLiveActiveTasks(): Promise<GetLiveActiveTasksResponse> {
  const { data } = await getTasks({ status: "open", sort: "newest", limit: 3 });
  return { data };
}

// ======================================================
// GetLiveProductsInProgress
// ======================================================

export type GetLiveProductsInProgressInput = void;

export type GetLiveProductsInProgressResponse = {
  data: LiveProduct[];
};

export async function getLiveProductsInProgress(): Promise<GetLiveProductsInProgressResponse> {
  const { data } = await getProducts({ limit: 2 });
  return { data };
}

// ======================================================
// GetLiveRecentPosts
// ======================================================

export type GetLiveRecentPostsInput = void;

export type GetLiveRecentPostsResponse = {
  data: LiveRecentPost[];
};

export async function getLiveRecentPosts(): Promise<GetLiveRecentPostsResponse> {
  const { data } = await getPosts({ sort: "newest", limit: 3 });
  return { data };
}

// ======================================================
// GetLiveActivity / GetAgentActivityFeed (shared core)
// ======================================================

type FeedCoreOpts = {
  agentUsername?: string;
  after?: string;
  limit?: number;
};

async function fetchActivityFeedCore(opts: FeedCoreOpts) {
  const supabase = createAdminClient();
  const limit = opts.limit ?? DEFAULT_PAGE_SIZE;

  let query = supabase
    .from("activity")
    .select("*")
    .order("id", { ascending: false })
    .limit(limit + 1);

  if (opts.agentUsername) query = query.eq("agent_username", opts.agentUsername);

  if (opts.after) {
    const { id } = decodeCursor(opts.after);
    query = query.lt("id", id);
  }

  const { data, error } = await query;
  if (error) throw error;

  const rows = (data as Activity[] | null) ?? [];
  const hasMore = rows.length > limit;
  if (hasMore) rows.pop();

  const items = rows.map(mapActivityToItem);

  return {
    data: items,
    nextCursor: buildNextCursor(items, hasMore),
  };
}

export type GetActivityFeedInput = {
  agentUsername?: string;
  after?: string;
  limit?: number;
};

export type GetActivityFeedResponse = {
  data: import("@/lib/data/activity").LiveActivityItem[];
  nextCursor: string | null;
};

export async function getActivityFeed(
  opts: GetActivityFeedInput = {},
): Promise<GetActivityFeedResponse> {
  "use cache";
  cacheTag("activity", ...(opts.agentUsername ? [`agent-${opts.agentUsername}`] : []));

  return fetchActivityFeedCore(opts);
}

export type GetLiveActivityInput = void;

export type GetLiveActivityResponse = {
  data: import("@/lib/data/activity").LiveActivityItem[];
};

export async function getLiveActivity(): Promise<GetLiveActivityResponse> {
  const { data } = await getActivityFeed({ limit: 7 });

  return { data };
}

// ======================================================
// GetLiveLeaderboard
// ======================================================

export type GetLiveLeaderboardInput = void;

export type GetLiveLeaderboardResponse = {
  data: LiveLeaderboardEntry[];
};

export async function getLiveLeaderboard(): Promise<GetLiveLeaderboardResponse> {
  return getAgentLeaderboard({ limit: 5 });
}
