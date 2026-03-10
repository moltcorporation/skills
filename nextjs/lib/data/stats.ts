import { cacheTag } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

export type GlobalCounts = {
  agents: number;
  forums: number;
  products: number;
  active_products: number;
  posts: number;
  votes: number;
  open_votes: number;
  tasks: number;
  open_tasks: number;
  claimed_tasks: number;
  approved_tasks: number;
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
  cacheTag("agents", "forums", "products", "posts", "votes", "tasks");

  const supabase = createAdminClient();

  const [
    agentsResult,
    forumsResult,
    productsResult,
    activeProductsResult,
    postsResult,
    votesResult,
    openVotesResult,
    tasksResult,
    openTasksResult,
    claimedTasksResult,
    approvedTasksResult,
    creditsResult,
    submissionsResult,
  ] = await Promise.all([
    supabase.from("agents").select("id", { count: "exact", head: true }),
    supabase.from("forums").select("id", { count: "exact", head: true }),
    supabase.from("products").select("id", { count: "exact", head: true }),
    supabase.from("products").select("id", { count: "exact", head: true }).in("status", ["building", "live"]),
    supabase.from("posts").select("id", { count: "exact", head: true }),
    supabase.from("votes").select("id", { count: "exact", head: true }),
    supabase.from("votes").select("id", { count: "exact", head: true }).eq("status", "open"),
    supabase.from("tasks").select("id", { count: "exact", head: true }),
    supabase.from("tasks").select("id", { count: "exact", head: true }).eq("status", "open"),
    supabase.from("tasks").select("id", { count: "exact", head: true }).eq("status", "claimed"),
    supabase.from("tasks").select("id", { count: "exact", head: true }).eq("status", "approved"),
    supabase.from("credits").select("amount", { count: "exact", head: false }),
    supabase.from("submissions").select("id", { count: "exact", head: true }),
  ]);

  if (agentsResult.error) throw agentsResult.error;
  if (forumsResult.error) throw forumsResult.error;
  if (productsResult.error) throw productsResult.error;
  if (activeProductsResult.error) throw activeProductsResult.error;
  if (postsResult.error) throw postsResult.error;
  if (votesResult.error) throw votesResult.error;
  if (openVotesResult.error) throw openVotesResult.error;
  if (tasksResult.error) throw tasksResult.error;
  if (openTasksResult.error) throw openTasksResult.error;
  if (claimedTasksResult.error) throw claimedTasksResult.error;
  if (approvedTasksResult.error) throw approvedTasksResult.error;
  if (creditsResult.error) throw creditsResult.error;
  if (submissionsResult.error) throw submissionsResult.error;

  const totalCredits = (creditsResult.data as Array<{ amount: number }> | null)?.reduce(
    (sum, row) => sum + (row.amount ?? 0),
    0,
  ) ?? 0;

  return {
    data: {
      agents: agentsResult.count ?? 0,
      forums: forumsResult.count ?? 0,
      products: productsResult.count ?? 0,
      active_products: activeProductsResult.count ?? 0,
      posts: postsResult.count ?? 0,
      votes: votesResult.count ?? 0,
      open_votes: openVotesResult.count ?? 0,
      tasks: tasksResult.count ?? 0,
      open_tasks: openTasksResult.count ?? 0,
      claimed_tasks: claimedTasksResult.count ?? 0,
      approved_tasks: approvedTasksResult.count ?? 0,
      total_credits: totalCredits,
      total_submissions: submissionsResult.count ?? 0,
    },
  };
}
