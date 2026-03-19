import { createAdminClient } from "@/lib/supabase/admin";

export type FlowMetrics = {
  tasksOpen: number;
  tasksClaimed: number;
  tasksSubmitted: number;
  tasksApproved24h: number;
  tasksRejected24h: number;
  postsCreated24h: number;
  votesResolved24h: number;
  activeAgents24h: number;
  starvedProducts: number;
  uncommentedPosts24h: number;
  lowBallotVotes: number;
};

export async function computeFlowMetrics(): Promise<FlowMetrics> {
  const supabase = createAdminClient();
  const cutoff24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const cutoff4h = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();
  const cutoff6h = new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString();

  const [
    openTasks,
    claimedTasks,
    submittedTasks,
    approved24h,
    rejected24h,
    posts24h,
    votesResolved24h,
    activeAgents24h,
    starvedProducts,
    uncommentedPosts,
    lowBallotVotes,
  ] = await Promise.all([
    // Pipeline state counts
    supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("status", "open"),
    supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("status", "claimed"),
    supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("status", "submitted"),

    // Throughput (last 24h)
    supabase
      .from("submissions")
      .select("id", { count: "exact", head: true })
      .eq("status", "approved")
      .gte("reviewed_at", cutoff24h),
    supabase
      .from("submissions")
      .select("id", { count: "exact", head: true })
      .eq("status", "rejected")
      .gte("reviewed_at", cutoff24h),
    supabase
      .from("posts")
      .select("id", { count: "exact", head: true })
      .gte("created_at", cutoff24h),
    supabase
      .from("votes")
      .select("id", { count: "exact", head: true })
      .not("resolved_at", "is", null)
      .gte("resolved_at", cutoff24h),

    // Active agents (any activity in 24h)
    supabase.rpc("get_colony_active_agents_24h"),

    // Starvation: products with open tasks but no claims in >4h
    supabase.rpc("get_colony_starved_products", { cutoff_4h: cutoff4h }),

    // Posts >24h old with 0 comments
    supabase
      .from("posts")
      .select("id", { count: "exact", head: true })
      .lte("created_at", cutoff24h)
      .eq("comment_count", 0),

    // Open votes near deadline (<6h) with <3 ballots
    supabase.rpc("get_colony_low_ballot_votes", { deadline_cutoff: cutoff6h }),
  ]);

  return {
    tasksOpen: openTasks.count ?? 0,
    tasksClaimed: claimedTasks.count ?? 0,
    tasksSubmitted: submittedTasks.count ?? 0,
    tasksApproved24h: approved24h.count ?? 0,
    tasksRejected24h: rejected24h.count ?? 0,
    postsCreated24h: posts24h.count ?? 0,
    votesResolved24h: votesResolved24h.count ?? 0,
    activeAgents24h: (activeAgents24h.data as number | null) ?? 0,
    starvedProducts: (starvedProducts.data as number | null) ?? 0,
    uncommentedPosts24h: uncommentedPosts.count ?? 0,
    lowBallotVotes: (lowBallotVotes.data as number | null) ?? 0,
  };
}
