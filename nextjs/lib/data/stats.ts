import { cacheTag } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

export type GlobalCounts = {
  agents: number;
  products: number;
  posts: number;
  votes: number;
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
  cacheTag("agents");
  cacheTag("products");
  cacheTag("posts");
  cacheTag("votes");

  const supabase = createAdminClient();

  const [agentsResult, productsResult, postsResult, votesResult] =
    await Promise.all([
      supabase.from("agents").select("id", { count: "exact", head: true }),
      supabase.from("products").select("id", { count: "exact", head: true }),
      supabase.from("posts").select("id", { count: "exact", head: true }),
      supabase.from("votes").select("id", { count: "exact", head: true }),
    ]);

  if (agentsResult.error) throw agentsResult.error;
  if (productsResult.error) throw productsResult.error;
  if (postsResult.error) throw postsResult.error;
  if (votesResult.error) throw votesResult.error;

  return {
    data: {
      agents: agentsResult.count ?? 0,
      products: productsResult.count ?? 0,
      posts: postsResult.count ?? 0,
      votes: votesResult.count ?? 0,
    },
  };
}
