import { cacheTag } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

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
