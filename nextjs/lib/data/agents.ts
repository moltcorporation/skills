import { createAdminClient } from "@/lib/supabase/admin";
import { cacheTag } from "next/cache";

// ======================================================
// Shared
// ======================================================

// Only public fields — never expose api_key_hash, claim_token, etc.
const AGENT_SELECT =
  "id, name, username, bio, status, claimed_at, created_at, city, region, country, latitude, longitude" as const;

export type AgentStatus = "pending_claim" | "claimed" | "suspended";

export type Agent = {
  id: string;
  name: string;
  username: string;
  bio: string | null;
  status: AgentStatus;
  claimed_at: string | null;
  created_at: string;
  city: string | null;
  region: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
};

// ======================================================
// GetAgents
// ======================================================

export type GetAgentsInput = {
  status?: AgentStatus;
  search?: string;
  sort?: "newest" | "oldest";
  after?: string;
  limit?: number;
};

export type GetAgentsResponse = {
  data: Agent[];
  hasMore: boolean;
};

export async function getAgents(
  opts: GetAgentsInput = {},
): Promise<GetAgentsResponse> {
  "use cache";
  cacheTag("agents");

  const limit = opts.limit ?? 20;
  const sort = opts.sort ?? "newest";
  const ascending = sort === "oldest";
  const supabase = createAdminClient();

  // Base query: order by KSUID id, which is time-ordered lexicographically.
  let query = supabase
    .from("agents")
    .select(AGENT_SELECT)
    .order("id", { ascending })
    .limit(limit + 1); // +1 to detect if there are more pages

  // Optional filters — each combo becomes a unique cache key
  if (opts.status) query = query.eq("status", opts.status);
  if (opts.search) query = query.ilike("name", `%${opts.search}%`);
  if (opts.after) {
    query = ascending ? query.gt("id", opts.after) : query.lt("id", opts.after);
  }

  const { data, error } = await query;

  if (error) throw error;

  // If we got limit+1 rows, there's another page — pop the extra
  const hasMore = (data?.length ?? 0) > limit;
  if (hasMore) data!.pop();

  return {
    data: (data as Agent[] | null) ?? [],
    hasMore,
  };
}

// ======================================================
// GetAgentByUsername
// ======================================================

export type GetAgentByUsernameInput = string;

export type GetAgentByUsernameResponse = {
  data: Agent | null;
};

export async function getAgentByUsername(
  username: GetAgentByUsernameInput,
): Promise<GetAgentByUsernameResponse> {
  "use cache";
  cacheTag(`agent-${username}`);

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("agents")
    .select(AGENT_SELECT)
    .eq("username", username)
    .maybeSingle();

  if (error) throw error;
  return { data: (data as Agent | null) ?? null };
}
