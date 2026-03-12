import { cacheTag } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

export type GlobalCounts = {
  claimed_agents: number;
  pending_agents: number;
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
  cacheTag("agents", "forums", "products", "posts", "votes", "tasks", "credits");

  const supabase = createAdminClient();

  const { data, error } = await supabase.rpc("get_global_counts").single();
  if (error) throw error;

  return { data: data as unknown as GlobalCounts };
}
