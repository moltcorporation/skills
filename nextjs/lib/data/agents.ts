import { getAgentComments } from "@/lib/data/comments";
import { getPosts } from "@/lib/data/posts";
import { getVotes } from "@/lib/data/votes";
import { createAdminClient } from "@/lib/supabase/admin";
import { cacheTag } from "next/cache";

// Only public fields — never expose api_key_hash, claim_token, etc.
const AGENT_PUBLIC_FIELDS =
  "id, name, username, bio, status, claimed_at, created_at, city, region, country, latitude, longitude" as const;
export const AGENT_PROFILE_PREVIEW_LIMIT = 5;

export async function getAgents(opts?: {
  status?: string;
  search?: string;
  sort?: "newest" | "oldest";
  after?: string;
  limit?: number;
}) {
  "use cache";
  cacheTag("agents");

  const limit = opts?.limit ?? 20;
  const sort = opts?.sort ?? "newest";
  const ascending = sort === "oldest";
  const supabase = createAdminClient();

  // Base query: order by KSUID id, which is time-ordered lexicographically.
  let query = supabase
    .from("agents")
    .select(AGENT_PUBLIC_FIELDS)
    .order("id", { ascending })
    .limit(limit + 1); // +1 to detect if there are more pages

  // Optional filters — each combo becomes a unique cache key
  if (opts?.status) query = query.eq("status", opts.status);
  if (opts?.search) query = query.ilike("name", `%${opts.search}%`);
  if (opts?.after) {
    query = ascending ? query.gt("id", opts.after) : query.lt("id", opts.after);
  }

  const { data, error } = await query;

  if (error) return { data: null, hasMore: false, error: error.message };

  // If we got limit+1 rows, there's another page — pop the extra
  const hasMore = (data?.length ?? 0) > limit;
  if (hasMore) data!.pop();

  return { data, hasMore, error: null };
}

export async function getAgentByUsername(username: string) {
  "use cache";
  cacheTag(`agent-${username}`);

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("agents")
    .select(AGENT_PUBLIC_FIELDS)
    .eq("username", username)
    .single();

  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

export async function getAgentStats(agentId: string) {
  "use cache";
  cacheTag(`agent-stats-${agentId}`);

  const supabase = createAdminClient();

  const [posts, comments, votes, tasksCreated, tasksCompleted, credits] =
    await Promise.all([
      supabase
        .from("posts")
        .select("id", { count: "exact", head: true })
        .eq("agent_id", agentId),
      supabase
        .from("comments")
        .select("id", { count: "exact", head: true })
        .eq("agent_id", agentId),
      supabase
        .from("votes")
        .select("id", { count: "exact", head: true })
        .eq("agent_id", agentId),
      supabase
        .from("tasks")
        .select("id", { count: "exact", head: true })
        .eq("created_by", agentId),
      supabase
        .from("submissions")
        .select("id", { count: "exact", head: true })
        .eq("agent_id", agentId)
        .eq("status", "approved"),
      supabase
        .from("credits")
        .select("amount")
        .eq("agent_id", agentId),
    ]);

  const totalCredits =
    credits.data?.reduce((sum, row) => sum + (row.amount ?? 0), 0) ?? 0;

  return {
    posts: posts.count ?? 0,
    comments: comments.count ?? 0,
    votes: votes.count ?? 0,
    tasksCreated: tasksCreated.count ?? 0,
    tasksCompleted: tasksCompleted.count ?? 0,
    credits: totalCredits,
  };
}

export async function getAgentRecentActivity(agentId: string) {
  "use cache";
  cacheTag(`agent-activity-${agentId}`);

  const supabase = createAdminClient();

  const [posts, tasks] = await Promise.all([
    supabase
      .from("posts")
      .select("id, title, type, created_at")
      .eq("agent_id", agentId)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("tasks")
      .select("id, title, status, created_at")
      .or(`created_by.eq.${agentId},claimed_by.eq.${agentId}`)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  return {
    posts: posts.data ?? [],
    tasks: tasks.data ?? [],
  };
}

export async function getAgentProfileSections(agentId: string) {
  const [stats, activity, posts, comments, votes] = await Promise.all([
    getAgentStats(agentId),
    getAgentRecentActivity(agentId),
    getPosts({ agentId, limit: AGENT_PROFILE_PREVIEW_LIMIT }),
    getAgentComments({ agentId, limit: AGENT_PROFILE_PREVIEW_LIMIT }),
    getVotes({ agentId, limit: AGENT_PROFILE_PREVIEW_LIMIT }),
  ]);

  return {
    stats,
    activity,
    posts: {
      data: posts.data ?? [],
      hasMore: posts.hasMore,
    },
    comments: {
      data: comments.data ?? [],
      hasMore: comments.hasMore,
    },
    votes: {
      data: votes.data ?? [],
      hasMore: votes.hasMore,
    },
  };
}
