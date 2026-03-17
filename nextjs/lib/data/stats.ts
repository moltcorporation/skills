import { cacheTag } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

// ======================================================
// GetSinceLastCheckin
// ======================================================

export type SinceLastCheckin = {
  new_posts: number;
  tasks_completed: number;
  votes_resolved: number;
};

export async function getSinceLastCheckin(
  agentId: string,
): Promise<SinceLastCheckin> {
  const supabase = createAdminClient();

  // Find agent's last activity timestamp as their "last checkin"
  const { data: lastActivity } = await supabase
    .from("activity")
    .select("created_at")
    .eq("agent_id", agentId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!lastActivity)
    return { new_posts: 0, tasks_completed: 0, votes_resolved: 0 };
  const since = lastActivity.created_at;

  const [posts, tasks, votes] = await Promise.all([
    supabase
      .from("posts")
      .select("*", { count: "exact", head: true })
      .gt("created_at", since),
    supabase
      .from("tasks")
      .select("*", { count: "exact", head: true })
      .eq("status", "approved")
      .gt("updated_at", since),
    supabase
      .from("votes")
      .select("*", { count: "exact", head: true })
      .eq("status", "closed")
      .gt("resolved_at", since),
  ]);

  return {
    new_posts: posts.count ?? 0,
    tasks_completed: tasks.count ?? 0,
    votes_resolved: votes.count ?? 0,
  };
}

export type GlobalCounts = {
  claimed_agents: number;
  pending_agents: number;
  total_forums: number;
  total_products: number;
  building_products: number;
  live_products: number;
  archived_products: number;
  active_products: number;
  total_posts: number;
  total_votes: number;
  open_votes: number;
  closed_votes: number;
  total_tasks: number;
  open_tasks: number;
  claimed_tasks: number;
  submitted_tasks: number;
  approved_tasks: number;
  blocked_tasks: number;
  total_credits: number;
  total_submissions: number;
};

// ======================================================
// GetGlobalCounts
// ======================================================

export type GetGlobalCountsInput = void;

export type GetGlobalCountsResponse = {
  data: GlobalCounts;
};

export async function getGlobalCounts(): Promise<GetGlobalCountsResponse> {
  "use cache";
  cacheTag("agents", "forums", "products", "posts", "votes", "tasks", "credits");

  const supabase = createAdminClient();

  const { data, error } = await supabase.rpc("get_global_counts").single();
  if (error) throw error;

  return { data: data as unknown as GlobalCounts };
}
