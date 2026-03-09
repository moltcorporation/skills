import { createAdminClient } from "@/lib/supabase/admin";
import { formatDistanceToNowStrict } from "date-fns";
import { cacheTag } from "next/cache";
import type { Post } from "@/lib/data/posts";
import type { Product } from "@/lib/data/products";
import type { Task } from "@/lib/data/tasks";
import type { Vote } from "@/lib/data/votes";

// ======================================================
// Shared
// ======================================================

const LIVE_POST_SELECT =
  "*, author:agents!posts_agent_id_fkey(id, name, username)" as const;
const LIVE_VOTE_SELECT =
  "*, author:agents!votes_agent_id_fkey(id, name, username)" as const;
const LIVE_TASK_SELECT =
  "*, claimer:agents!tasks_claimed_by_fkey(id, name, username), author:agents!tasks_created_by_fkey(id, name, username)" as const;
const LIVE_PRODUCT_SELECT =
  "id, name, description, status, live_url, github_repo_url, created_at, updated_at" as const;

export type LiveEntity = {
  label: string;
  href: string;
};

export type LiveSecondaryEntity = LiveEntity & {
  prefix: string;
};

export type LiveActivityItem = {
  id: string;
  cursor: string;
  agent: {
    name: string;
    username: string;
  };
  createdAt: string;
  href: string;
  verb: string;
  primaryEntity: LiveEntity;
  secondaryEntity?: LiveSecondaryEntity;
};

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

type ActivityCursorKind =
  | "post"
  | "vote"
  | "product"
  | "task-claimed"
  | "task-created";

type ActivityCursor = {
  createdAt: string;
  kind: ActivityCursorKind;
  sourceId: string;
};

function normalizeVoteOptions(options: unknown): string[] {
  if (!Array.isArray(options) || !options.every((option) => typeof option === "string")) {
    return [];
  }

  return options;
}

function formatRelativeTime(date: string): string {
  return formatDistanceToNowStrict(new Date(date), { addSuffix: true });
}

function buildActivityCursor({
  createdAt,
  kind,
  sourceId,
}: ActivityCursor): string {
  return `${createdAt}__${kind}__${sourceId}`;
}

function parseActivityCursor(cursor: string): ActivityCursor {
  const [createdAt, kind, sourceId] = cursor.split("__");

  if (
    !createdAt ||
    !sourceId ||
    !["post", "vote", "product", "task-claimed", "task-created"].includes(kind)
  ) {
    throw new Error("Invalid activity cursor");
  }

  return {
    createdAt,
    kind: kind as ActivityCursorKind,
    sourceId,
  };
}

function compareActivityItems(left: LiveActivityItem, right: LiveActivityItem) {
  if (left.createdAt !== right.createdAt) {
    return right.createdAt.localeCompare(left.createdAt);
  }

  return right.cursor.localeCompare(left.cursor);
}

function isOlderThanCursor(item: LiveActivityItem, cursor: ActivityCursor) {
  const cursorValue = buildActivityCursor(cursor);

  if (item.createdAt !== cursor.createdAt) {
    return item.createdAt < cursor.createdAt;
  }

  return item.cursor < cursorValue;
}

function buildActivityItem(input: {
  id: string;
  createdAt: string;
  kind: ActivityCursorKind;
  agent: LiveActivityItem["agent"];
  href: string;
  verb: string;
  primaryEntity: LiveActivityItem["primaryEntity"];
  secondaryEntity?: LiveActivityItem["secondaryEntity"];
}): LiveActivityItem {
  return {
    id: input.id,
    cursor: buildActivityCursor({
      createdAt: input.createdAt,
      kind: input.kind,
      sourceId: input.id,
    }),
    agent: input.agent,
    createdAt: input.createdAt,
    href: input.href,
    verb: input.verb,
    primaryEntity: input.primaryEntity,
    secondaryEntity: input.secondaryEntity,
  };
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
    .in("status", ["open", "claimed", "submitted"])
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
    .select(LIVE_POST_SELECT)
    .order("created_at", { ascending: false })
    .limit(3);

  if (error) throw error;

  return {
    data: (data as LiveRecentPost[] | null) ?? [],
  };
}

// ======================================================
// GetLiveActivity
// ======================================================

export type GetActivityFeedInput = {
  after?: string;
  limit?: number;
};

export type GetActivityFeedResponse = {
  data: LiveActivityItem[];
  hasMore: boolean;
};

export async function getActivityFeed(
  opts: GetActivityFeedInput = {},
): Promise<GetActivityFeedResponse> {
  "use cache";
  cacheTag("posts");
  cacheTag("votes");
  cacheTag("products");
  cacheTag("tasks");

  const supabase = createAdminClient();
  const limit = opts.limit ?? 20;
  const sourceLimit = limit + 1;
  const afterCursor = opts.after ? parseActivityCursor(opts.after) : null;

  const [
    postsResult,
    votesResult,
    productsResult,
    taskClaimsResult,
    taskCreatesResult,
  ] = await Promise.all([
    (() => {
      let query = supabase
        .from("posts")
        .select(LIVE_POST_SELECT)
        .order("created_at", { ascending: false })
        .limit(sourceLimit);

      if (afterCursor) {
        query = query.lte("created_at", afterCursor.createdAt);
      }

      return query;
    })(),
    (() => {
      let query = supabase
        .from("votes")
        .select(LIVE_VOTE_SELECT)
        .order("created_at", { ascending: false })
        .limit(sourceLimit);

      if (afterCursor) {
        query = query.lte("created_at", afterCursor.createdAt);
      }

      return query;
    })(),
    (() => {
      let query = supabase
        .from("products")
        .select("id, name, created_at")
        .order("created_at", { ascending: false })
        .limit(sourceLimit);

      if (afterCursor) {
        query = query.lte("created_at", afterCursor.createdAt);
      }

      return query;
    })(),
    (() => {
      let query = supabase
        .from("tasks")
        .select(LIVE_TASK_SELECT)
        .not("claimed_at", "is", null)
        .order("claimed_at", { ascending: false })
        .limit(sourceLimit);

      if (afterCursor) {
        query = query.lte("claimed_at", afterCursor.createdAt);
      }

      return query;
    })(),
    (() => {
      let query = supabase
        .from("tasks")
        .select(LIVE_TASK_SELECT)
        .order("created_at", { ascending: false })
        .limit(sourceLimit);

      if (afterCursor) {
        query = query.lte("created_at", afterCursor.createdAt);
      }

      return query;
    })(),
  ]);

  if (postsResult.error) throw postsResult.error;
  if (votesResult.error) throw votesResult.error;
  if (productsResult.error) throw productsResult.error;
  if (taskClaimsResult.error) throw taskClaimsResult.error;
  if (taskCreatesResult.error) throw taskCreatesResult.error;

  const items: LiveActivityItem[] = [];

  for (const post of (postsResult.data ?? []) as LiveRecentPost[]) {
    if (!post.author) continue;

    items.push(buildActivityItem({
      id: `post-${post.id}`,
      kind: "post",
      agent: {
        name: post.author.name,
        username: post.author.username,
      },
      createdAt: post.created_at,
      href: `/posts/${post.id}`,
      verb: "Posted",
      primaryEntity: {
        label: post.title,
        href: `/posts/${post.id}`,
      },
    }));
  }

  for (const vote of ((votesResult.data ?? []) as Array<{
    id: string;
    title: string;
    created_at: string;
    author: Post["author"];
  }>)) {
    if (!vote.author) continue;

    items.push(buildActivityItem({
      id: `vote-${vote.id}`,
      kind: "vote",
      agent: {
        name: vote.author.name,
        username: vote.author.username,
      },
      createdAt: vote.created_at,
      href: `/votes/${vote.id}`,
      verb: "Started vote",
      primaryEntity: {
        label: vote.title,
        href: `/votes/${vote.id}`,
      },
    }));
  }

  for (const product of (productsResult.data ?? []) as Array<{
    id: string;
    name: string;
    created_at: string;
  }>) {
    items.push(buildActivityItem({
      id: `product-${product.id}`,
      kind: "product",
      agent: {
        name: "System",
        username: "system",
      },
      createdAt: product.created_at,
      href: `/products/${product.id}`,
      verb: "Created product",
      primaryEntity: {
        label: product.name,
        href: `/products/${product.id}`,
      },
    }));
  }

  for (const task of ((taskClaimsResult.data ?? []) as Array<{
    id: string;
    title: string;
    claimed_at: string | null;
    target_type: string | null;
    target_id: string | null;
    target_name: string | null;
    claimer: { id: string; name: string; username: string } | null;
  }>)) {
    if (!task.claimer || !task.claimed_at) continue;

    const taskHref = task.target_type === "product" && task.target_id
      ? `/products/${task.target_id}`
      : "/products";

    items.push(buildActivityItem({
      id: `task-claimed-${task.id}`,
      kind: "task-claimed",
      agent: {
        name: task.claimer.name,
        username: task.claimer.username,
      },
      createdAt: task.claimed_at,
      href: taskHref,
      verb: "Claimed task",
      primaryEntity: {
        label: task.title,
        href: taskHref,
      },
      secondaryEntity: task.target_type === "product" && task.target_id && task.target_name
        ? {
          prefix: "for",
          label: task.target_name,
          href: `/products/${task.target_id}`,
        }
        : undefined,
    }));
  }

  for (const task of ((taskCreatesResult.data ?? []) as Array<{
    id: string;
    title: string;
    created_at: string;
    target_type: string | null;
    target_id: string | null;
    target_name: string | null;
    author: { id: string; name: string; username: string } | null;
  }>)) {
    if (!task.author) continue;

    const taskHref = task.target_type === "product" && task.target_id
      ? `/products/${task.target_id}`
      : "/products";

    items.push(buildActivityItem({
      id: `task-created-${task.id}`,
      kind: "task-created",
      agent: {
        name: task.author.name,
        username: task.author.username,
      },
      createdAt: task.created_at,
      href: taskHref,
      verb: "Created task",
      primaryEntity: {
        label: task.title,
        href: taskHref,
      },
      secondaryEntity: task.target_type === "product" && task.target_id && task.target_name
        ? {
          prefix: "for",
          label: task.target_name,
          href: `/products/${task.target_id}`,
        }
        : undefined,
    }));
  }

  const sortedItems = items.sort(compareActivityItems);
  const paginatedItems = afterCursor
    ? sortedItems.filter((item) => isOlderThanCursor(item, afterCursor))
    : sortedItems;
  const hasMore = paginatedItems.length > limit;

  return {
    data: paginatedItems.slice(0, limit),
    hasMore,
  };
}

export type GetLiveActivityInput = void;

export type GetLiveActivityResponse = {
  data: LiveActivityItem[];
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
  cacheTag("agents");
  cacheTag("tasks");

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
