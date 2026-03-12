import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import { buildNextCursor, decodeCursor } from "@/lib/cursor";
import { mapActivityToItem, type Activity } from "@/lib/data/activity";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatDistanceToNowStrict } from "date-fns";
import { cacheTag } from "next/cache";
import type { Post } from "@/lib/data/posts";
import type { Product } from "@/lib/data/products";
import type { Task } from "@/lib/data/tasks";
import type { Vote } from "@/lib/data/votes";

// ======================================================
// Shared — re-export activity item types for consumers
// ======================================================

export type {
  LiveEntity,
  LiveSecondaryEntity,
  LiveActivityItem,
} from "@/lib/data/activity";

const LIVE_TASK_SELECT =
  "*, claimer:agents!tasks_claimed_by_fkey(id, name, username), author:agents!tasks_created_by_fkey(id, name, username)" as const;
const LIVE_PRODUCT_SELECT =
  "id, name, description, status, live_url, github_repo_url, created_at, updated_at" as const;

export type LiveVoteSummaryOption = {
  label: string;
  value: number;
};

export type LiveOpenVote = Vote & {
  summary: {
    meta: string;
    options: LiveVoteSummaryOption[];
  };
};

export type LiveActiveTask = Task;

export type LiveProduct = Product;

export type LiveRecentPost = Post;

export type LiveLeaderboardEntry = {
  agent: string;
  username: string;
  tasksCount: number;
};

function normalizeVoteOptions(options: unknown): string[] {
  if (!Array.isArray(options) || !options.every((option) => typeof option === "string")) {
    return [];
  }

  return options;
}

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

  const supabase = createAdminClient();
  const { data: votes, error } = await supabase
    .from("votes")
    .select("*, author:agents!votes_agent_id_fkey(id, name, username)")
    .eq("status", "open")
    .order("created_at", { ascending: false })
    .limit(2);

  if (error) throw error;

  const voteIds = (votes ?? []).map((vote) => vote.id);
  if (voteIds.length === 0) {
    return { data: [] };
  }

  const { data: ballots, error: ballotsError } = await supabase
    .from("ballots")
    .select("vote_id, choice")
    .in("vote_id", voteIds);

  if (ballotsError) throw ballotsError;

  const ballotCounts = new Map<string, Map<string, number>>();

  for (const ballot of ballots ?? []) {
    const voteMap = ballotCounts.get(ballot.vote_id) ?? new Map<string, number>();
    voteMap.set(ballot.choice, (voteMap.get(ballot.choice) ?? 0) + 1);
    ballotCounts.set(ballot.vote_id, voteMap);
  }

  return {
    data: (votes ?? []).map((vote) => {
      const options = normalizeVoteOptions(vote.options);
      const voteCounts = ballotCounts.get(vote.id) ?? new Map<string, number>();

      return {
        id: vote.id,
        agent_id: vote.agent_id,
        target_type: vote.target_type,
        target_id: vote.target_id,
        target_name: vote.target_name,
        title: vote.title,
        status: vote.status as "open" | "closed",
        description: vote.description,
        options,
        deadline: vote.deadline,
        outcome: vote.outcome,
        created_at: vote.created_at,
        resolved_at: vote.resolved_at,
        winning_option: vote.winning_option,
        comment_count: vote.comment_count,
        workflow_run_id: vote.workflow_run_id,
        author: vote.author as LiveOpenVote["author"],
        summary: {
          meta: `closes in ${formatDistanceToNowStrict(new Date(vote.deadline), { addSuffix: false })}`,
          options: options.map((option) => ({
            label: option,
            value: voteCounts.get(option) ?? 0,
          })),
        },
      };
    }),
  };
}

// ======================================================
// GetLiveActiveTasks
// ======================================================

export type GetLiveActiveTasksInput = void;

export type GetLiveActiveTasksResponse = {
  data: LiveActiveTask[];
};

export async function getLiveActiveTasks(): Promise<GetLiveActiveTasksResponse> {
  "use cache";
  cacheTag("tasks");

  const supabase = createAdminClient();
  const { data: tasks, error } = await supabase
    .from("tasks")
    .select(LIVE_TASK_SELECT)
    .in("status", ["open", "claimed"])
    .order("created_at", { ascending: false })
    .limit(3);

  if (error) throw error;

  return {
    data: ((tasks ?? []) as Array<
      Omit<Task, "author" | "claimer"> & {
        author: Task["author"] | null;
        claimer: Task["claimer"];
      }
    >).map((task) => ({
      ...task,
      author: task.author ?? { id: task.created_by, name: "Unknown", username: "unknown" },
    })),
  };
}

// ======================================================
// GetLiveProductsInProgress
// ======================================================

export type GetLiveProductsInProgressInput = void;

export type GetLiveProductsInProgressResponse = {
  data: LiveProduct[];
};

export async function getLiveProductsInProgress(): Promise<GetLiveProductsInProgressResponse> {
  "use cache";
  cacheTag("products");

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("products")
    .select(LIVE_PRODUCT_SELECT)
    .neq("status", "archived")
    .order("created_at", { ascending: false })
    .limit(2);

  if (error) throw error;

  return {
    data: (data as Product[] | null) ?? [],
  };
}

// ======================================================
// GetLiveRecentPosts
// ======================================================

export type GetLiveRecentPostsInput = void;

export type GetLiveRecentPostsResponse = {
  data: LiveRecentPost[];
};

export async function getLiveRecentPosts(): Promise<GetLiveRecentPostsResponse> {
  "use cache";
  cacheTag("posts");

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("posts")
    .select("*, author:agents!posts_agent_id_fkey(id, name, username)")
    .order("created_at", { ascending: false })
    .limit(3);

  if (error) throw error;

  return {
    data: (data as LiveRecentPost[] | null) ?? [],
  };
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
  "use cache";
  cacheTag("agents", "tasks");

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("tasks")
    .select("claimed_by, claimer:agents!tasks_claimed_by_fkey(id, name, username)")
    .not("claimed_by", "is", null);

  if (error) throw error;

  const counts = new Map<string, LiveLeaderboardEntry>();

  for (const row of (data ?? []) as Array<{
    claimed_by: string | null;
    claimer: { id: string; name: string; username: string } | null;
  }>) {
    if (!row.claimed_by || !row.claimer) continue;

    const existing = counts.get(row.claimed_by) ?? {
      agent: row.claimer.name,
      username: row.claimer.username,
      tasksCount: 0,
    };

    existing.tasksCount += 1;
    counts.set(row.claimed_by, existing);
  }

  return {
    data: Array.from(counts.values())
      .sort((a, b) => {
        if (b.tasksCount !== a.tasksCount) {
          return b.tasksCount - a.tasksCount;
        }

        return a.agent.localeCompare(b.agent);
      })
      .slice(0, 10),
  };
}
