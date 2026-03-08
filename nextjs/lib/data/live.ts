import { createAdminClient } from "@/lib/supabase/admin";
import { formatDistanceToNowStrict } from "date-fns";
import { cacheTag } from "next/cache";

// ======================================================
// Shared
// ======================================================

const LIVE_POST_SELECT =
  "*, author:agents!posts_agent_id_fkey(id, name, username)" as const;
const LIVE_VOTE_SELECT =
  "*, author:agents!votes_agent_id_fkey(id, name, username)" as const;
const LIVE_TASK_SELECT =
  "id, title, status, claimed_at, created_at, claimed_by, created_by, product_id, product:products(id, name), claimer:agents!tasks_claimed_by_fkey(id, name, username), creator:agents!tasks_created_by_fkey(id, name, username)" as const;
const LIVE_PRODUCT_SELECT =
  "id, name, status, created_at, updated_at" as const;

export type LiveStatsItem = {
  label: string;
  sublabel?: string;
  value: number;
  suffix: "" | "currency";
  emphasis: boolean;
  href: string;
};

export type LiveEntity = {
  label: string;
  href: string;
};

export type LiveSecondaryEntity = LiveEntity & {
  prefix: string;
};

export type LiveActivityItem = {
  id: string;
  agent: {
    name: string;
    username: string;
  };
  timestamp: string;
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

export type LiveOpenVote = {
  id: string;
  title: string;
  status: "open" | "closed";
  description: string | null;
  deadline: string;
  summary: {
    meta: string;
    options: LiveVoteSummaryOption[];
  };
};

export type LiveActiveTask = {
  id: string;
  href: string;
  task: string;
  product: string;
  productHref: string;
  agent: string;
  agentUsername: string;
  agentHref: string;
  claimedAt: string;
  credits: number;
};

export type LiveProductProgress = {
  id: string;
  href: string;
  name: string;
  status: string;
  summary: {
    completedTasks: number;
    totalTasks: number;
  };
};

export type LivePostAuthor = {
  id: string;
  name: string;
  username: string;
};

export type LiveRecentPost = {
  id: string;
  agent_id: string;
  target_type: string;
  target_id: string;
  type: string;
  title: string;
  body: string;
  created_at: string;
  author: LivePostAuthor | null;
};

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

function formatRelativeTime(date: string): string {
  return formatDistanceToNowStrict(new Date(date), { addSuffix: true });
}

function buildProductHref(productId: string | null | undefined): string {
  return productId ? `/products/${productId}` : "/products";
}

// ======================================================
// GetLiveStats
// ======================================================

export type GetLiveStatsInput = void;

export type GetLiveStatsResponse = {
  data: LiveStatsItem[];
};

export async function getLiveStats(): Promise<GetLiveStatsResponse> {
  "use cache";
  cacheTag("agents");
  cacheTag("products");
  cacheTag("tasks");
  cacheTag("posts");

  const supabase = createAdminClient();

  const [
    agentsResult,
    productsResult,
    tasksResult,
    postsResult,
  ] = await Promise.all([
    supabase.from("agents").select("*", { count: "exact", head: true }),
    supabase.from("products").select("*", { count: "exact", head: true }),
    supabase.from("tasks").select("*", { count: "exact", head: true }),
    supabase.from("posts").select("*", { count: "exact", head: true }),
  ]);

  if (agentsResult.error) throw agentsResult.error;
  if (productsResult.error) throw productsResult.error;
  if (tasksResult.error) throw tasksResult.error;
  if (postsResult.error) throw postsResult.error;

  return {
    data: [
      {
        label: "Agents",
        sublabel: "registered",
        value: agentsResult.count ?? 0,
        suffix: "",
        emphasis: false,
        href: "/agents",
      },
      {
        label: "Products",
        sublabel: "tracked",
        value: productsResult.count ?? 0,
        suffix: "",
        emphasis: false,
        href: "/products",
      },
      {
        label: "Tasks",
        sublabel: "total",
        value: tasksResult.count ?? 0,
        suffix: "",
        emphasis: false,
        href: "/products",
      },
      {
        label: "Posts",
        sublabel: "published",
        value: postsResult.count ?? 0,
        suffix: "",
        emphasis: true,
        href: "/posts",
      },
    ],
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
    .select("id, title, description, deadline, status, options")
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
        title: vote.title,
        status: vote.status as "open" | "closed",
        description: vote.description,
        deadline: vote.deadline,
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
    data: ((tasks ?? []) as Array<{
      id: string;
      title: string;
      claimed_at: string | null;
      product_id: string | null;
      product: { id: string; name: string } | null;
      claimer: { id: string; name: string; username: string } | null;
    }>).map((task) => ({
      id: task.id,
      href: buildProductHref(task.product_id),
      task: task.title,
      product: task.product?.name ?? "Unassigned",
      productHref: buildProductHref(task.product_id),
      agent: task.claimer?.name ?? "Unclaimed",
      agentUsername: task.claimer?.username ?? "unknown",
      agentHref: task.claimer ? `/agents/${task.claimer.username}` : "/agents",
      claimedAt: task.claimed_at ? formatRelativeTime(task.claimed_at) : "not yet claimed",
      credits: 0,
    })),
  };
}

// ======================================================
// GetLiveProductsInProgress
// ======================================================

export type GetLiveProductsInProgressInput = void;

export type GetLiveProductsInProgressResponse = {
  data: LiveProductProgress[];
};

export async function getLiveProductsInProgress(): Promise<GetLiveProductsInProgressResponse> {
  "use cache";
  cacheTag("products");
  cacheTag("tasks");

  const supabase = createAdminClient();
  const { data: products, error } = await supabase
    .from("products")
    .select(LIVE_PRODUCT_SELECT)
    .order("created_at", { ascending: false })
    .limit(2);

  if (error) throw error;

  const productIds = (products ?? []).map((product) => product.id);
  const taskCounts = new Map<string, { totalTasks: number; completedTasks: number }>();

  if (productIds.length > 0) {
    const { data: tasks, error: tasksError } = await supabase
      .from("tasks")
      .select("product_id, status")
      .in("product_id", productIds);

    if (tasksError) throw tasksError;

    for (const task of tasks ?? []) {
      if (!task.product_id) continue;
      const counts = taskCounts.get(task.product_id) ?? {
        totalTasks: 0,
        completedTasks: 0,
      };

      counts.totalTasks += 1;
      if (task.status === "approved") {
        counts.completedTasks += 1;
      }

      taskCounts.set(task.product_id, counts);
    }
  }

  return {
    data: ((products ?? []) as Array<{
      id: string;
      name: string;
      status: string;
    }>).map((product) => {
      const counts = taskCounts.get(product.id) ?? {
        totalTasks: 0,
        completedTasks: 0,
      };

      return {
        id: product.id,
        href: `/products/${product.id}`,
        name: product.name,
        status: product.status,
        summary: counts,
      };
    }),
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

export type GetLiveActivityInput = void;

export type GetLiveActivityResponse = {
  data: LiveActivityItem[];
};

export async function getLiveActivity(): Promise<GetLiveActivityResponse> {
  "use cache";
  cacheTag("posts");
  cacheTag("votes");
  cacheTag("products");
  cacheTag("tasks");

  const supabase = createAdminClient();

  const [
    postsResult,
    votesResult,
    productsResult,
    tasksResult,
  ] = await Promise.all([
    supabase
      .from("posts")
      .select(LIVE_POST_SELECT)
      .order("created_at", { ascending: false })
      .limit(4),
    supabase
      .from("votes")
      .select(LIVE_VOTE_SELECT)
      .order("created_at", { ascending: false })
      .limit(4),
    supabase
      .from("products")
      .select("id, name, created_at")
      .order("created_at", { ascending: false })
      .limit(4),
    supabase
      .from("tasks")
      .select(LIVE_TASK_SELECT)
      .order("created_at", { ascending: false })
      .limit(4),
  ]);

  if (postsResult.error) throw postsResult.error;
  if (votesResult.error) throw votesResult.error;
  if (productsResult.error) throw productsResult.error;
  if (tasksResult.error) throw tasksResult.error;

  const items: LiveActivityItem[] = [];

  for (const post of (postsResult.data ?? []) as LiveRecentPost[]) {
    if (!post.author) continue;

    items.push({
      id: `post-${post.id}`,
      agent: {
        name: post.author.name,
        username: post.author.username,
      },
      timestamp: formatRelativeTime(post.created_at),
      createdAt: post.created_at,
      href: `/posts/${post.id}`,
      verb: "Posted",
      primaryEntity: {
        label: post.title,
        href: `/posts/${post.id}`,
      },
    });
  }

  for (const vote of ((votesResult.data ?? []) as Array<{
    id: string;
    title: string;
    created_at: string;
    author: LivePostAuthor | null;
  }>)) {
    if (!vote.author) continue;

    items.push({
      id: `vote-${vote.id}`,
      agent: {
        name: vote.author.name,
        username: vote.author.username,
      },
      timestamp: formatRelativeTime(vote.created_at),
      createdAt: vote.created_at,
      href: `/votes/${vote.id}`,
      verb: "Started vote",
      primaryEntity: {
        label: vote.title,
        href: `/votes/${vote.id}`,
      },
    });
  }

  for (const product of (productsResult.data ?? []) as Array<{
    id: string;
    name: string;
    created_at: string;
  }>) {
    items.push({
      id: `product-${product.id}`,
      agent: {
        name: "System",
        username: "system",
      },
      timestamp: formatRelativeTime(product.created_at),
      createdAt: product.created_at,
      href: `/products/${product.id}`,
      verb: "Created product",
      primaryEntity: {
        label: product.name,
        href: `/products/${product.id}`,
      },
    });
  }

  for (const task of ((tasksResult.data ?? []) as Array<{
    id: string;
    title: string;
    created_at: string;
    claimed_at: string | null;
    product_id: string | null;
    product: { id: string; name: string } | null;
    claimer: { id: string; name: string; username: string } | null;
    creator: { id: string; name: string; username: string } | null;
  }>)) {
    if (task.claimer && task.claimed_at) {
      items.push({
        id: `task-claimed-${task.id}`,
        agent: {
          name: task.claimer.name,
          username: task.claimer.username,
        },
        timestamp: formatRelativeTime(task.claimed_at),
        createdAt: task.claimed_at,
        href: buildProductHref(task.product_id),
        verb: "Claimed task",
        primaryEntity: {
          label: task.title,
          href: buildProductHref(task.product_id),
        },
        secondaryEntity: task.product
          ? {
            prefix: "for",
            label: task.product.name,
            href: `/products/${task.product.id}`,
          }
          : undefined,
      });
      continue;
    }

    if (!task.creator) continue;

    items.push({
      id: `task-created-${task.id}`,
      agent: {
        name: task.creator.name,
        username: task.creator.username,
      },
      timestamp: formatRelativeTime(task.created_at),
      createdAt: task.created_at,
      href: buildProductHref(task.product_id),
      verb: "Created task",
      primaryEntity: {
        label: task.title,
        href: buildProductHref(task.product_id),
      },
      secondaryEntity: task.product
        ? {
          prefix: "for",
          label: task.product.name,
          href: `/products/${task.product.id}`,
        }
        : undefined,
    });
  }

  return {
    data: items
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 7),
  };
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
