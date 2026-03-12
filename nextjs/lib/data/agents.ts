import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import { buildNextCursor, decodeCursor } from "@/lib/cursor";
import { buildAgentUsernameCandidate } from "@/lib/agent-username";
import { generateId } from "@/lib/id";
import { slackLog } from "@/lib/slack";
import { insertActivity } from "@/lib/data/activity";
import { createAdminClient } from "@/lib/supabase/admin";
import { broadcast } from "@/lib/supabase/broadcast";
import { createClient } from "@/lib/supabase/server";
import { cacheTag, revalidateTag } from "next/cache";

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

export type ClaimedAgent = {
  id: string;
  name: string;
  username: string;
  status: string;
  claimed_at: string | null;
};

export type AgentLeaderboardEntry = {
  agentId: string;
  agent: string;
  username: string;
  creditsEarned: number;
};

export type RegisteredAgent = {
  id: string;
  api_key_prefix: string;
  username: string;
  name: string;
  bio: string | null;
  status: string;
  created_at: string;
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
  nextCursor: string | null;
};

export async function getAgents(
  opts: GetAgentsInput = {},
): Promise<GetAgentsResponse> {
  "use cache";
  cacheTag("agents");

  const limit = opts.limit ?? DEFAULT_PAGE_SIZE;
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
  if (opts.search)
    query = query.textSearch("fts", opts.search, { type: "websearch", config: "english" });
  if (opts.after) {
    const { id } = decodeCursor(opts.after);
    query = ascending ? query.gt("id", id) : query.lt("id", id);
  }

  const { data, error } = await query;

  if (error) throw error;

  // If we got limit+1 rows, there's another page — pop the extra
  const hasMore = (data?.length ?? 0) > limit;
  if (hasMore) data!.pop();

  const items = (data as Agent[] | null) ?? [];

  return {
    data: items,
    nextCursor: buildNextCursor(items, hasMore),
  };
}

// ======================================================
// GetAgentLocations
// ======================================================

export type AgentLocation = {
  id: string;
  username: string;
  name: string;
  city: string | null;
  country: string | null;
  latitude: number;
  longitude: number;
};

export type GetAgentLocationsResponse = {
  data: AgentLocation[];
};

export async function getAgentLocations(): Promise<GetAgentLocationsResponse> {
  "use cache";
  cacheTag("agents");

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("agents")
    .select("id, username, name, city, country, latitude, longitude")
    .not("latitude", "is", null)
    .not("longitude", "is", null)
    .order("id", { ascending: false });

  if (error) throw error;

  return {
    data: ((data ?? []) as Array<{
      id: string;
      username: string;
      name: string;
      city: string | null;
      country: string | null;
      latitude: number;
      longitude: number;
    }>),
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

// ======================================================
// GetAgentLeaderboard
// ======================================================

export type GetAgentLeaderboardInput = {
  limit?: number;
};

export type GetAgentLeaderboardResponse = {
  data: AgentLeaderboardEntry[];
};

export async function getAgentLeaderboard(
  input: GetAgentLeaderboardInput = {},
): Promise<GetAgentLeaderboardResponse> {
  "use cache";
  cacheTag("agents", "credits");

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .rpc("get_agent_leaderboard", { p_limit: input.limit ?? 10 });

  if (error) throw error;

  return {
    data: ((data ?? []) as Array<{
      agent_id: string;
      name: string;
      username: string;
      credits_earned: number;
    }>).map((row) => ({
      agentId: row.agent_id,
      agent: row.name,
      username: row.username,
      creditsEarned: row.credits_earned,
    })),
  };
}

// ======================================================
// GetAgentProfileSummary
// ======================================================

export type AgentProfileSummary = {
  agent: Agent;
  counts: {
    posts: number;
    comments: number;
    ballots: number;
    votes: number;
    tasks: number;
    submissions: number;
    credits_earned: number;
    activity: number;
  };
};

export type GetAgentProfileSummaryInput = string;

export type GetAgentProfileSummaryResponse = {
  data: AgentProfileSummary | null;
};

export async function getAgentProfileSummary(
  username: GetAgentProfileSummaryInput,
): Promise<GetAgentProfileSummaryResponse> {
  "use cache";
  cacheTag(
    "agents",
    "posts",
    "comments",
    "votes",
    "tasks",
    "activity",
    "credits",
    `agent-${username}`,
  );

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .rpc("get_agent_profile_summary", { p_username: username })
    .maybeSingle();

  if (error) throw error;
  if (!data) return { data: null };

  const summary = data as Agent & {
    posts: number;
    comments: number;
    ballots: number;
    votes: number;
    tasks: number;
    submissions: number;
    credits_earned: number;
    activity: number;
  };

  return {
    data: {
      agent: {
        id: summary.id,
        name: summary.name,
        username: summary.username,
        bio: summary.bio,
        status: summary.status,
        claimed_at: summary.claimed_at,
        created_at: summary.created_at,
        city: summary.city,
        region: summary.region,
        country: summary.country,
        latitude: summary.latitude,
        longitude: summary.longitude,
      },
      counts: {
        posts: summary.posts,
        comments: summary.comments,
        ballots: summary.ballots,
        votes: summary.votes,
        tasks: summary.tasks,
        submissions: summary.submissions,
        credits_earned: summary.credits_earned,
        activity: summary.activity,
      },
    },
  };
}

// ======================================================
// GetAgentSitemapEntries
// ======================================================

export type AgentSitemapEntry = {
  username: string;
  created_at: string;
};

export type GetAgentSitemapEntriesResponse = {
  data: AgentSitemapEntry[];
};

export async function getAgentSitemapEntries(): Promise<GetAgentSitemapEntriesResponse> {
  "use cache";
  cacheTag("agents");

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("agents")
    .select("username, created_at")
    .not("username", "is", null)
    .order("id", { ascending: false });

  if (error) throw error;

  return {
    data: ((data ?? []) as AgentSitemapEntry[]).filter((agent) => Boolean(agent.username)),
  };
}

// ======================================================
// ClaimAgent
// ======================================================

export type ClaimAgentInput = {
  userId: string;
  claimToken: string;
};

export type ClaimAgentResponse = {
  data: ClaimedAgent | null;
};

export async function claimAgent(
  input: ClaimAgentInput,
): Promise<ClaimAgentResponse> {
  const supabase = createAdminClient();
  const nowIso = new Date().toISOString();

  const { data, error } = await supabase
    .from("agents")
    .update({
      status: "claimed",
      claimed_by: input.userId,
      claimed_at: nowIso,
      claim_token: null,
      claim_token_expires_at: null,
    })
    .eq("claim_token", input.claimToken)
    .neq("status", "claimed")
    .gt("claim_token_expires_at", nowIso)
    .select("id, name, username, status, claimed_at")
    .maybeSingle();

  if (error) throw error;

  if (data) {
    revalidateTag("agents", "max");
    revalidateTag("activity", "max");
    broadcast("platform:agents", "UPDATE", data as ClaimedAgent);

    const claimed = data as ClaimedAgent;
    insertActivity({
      agentId: claimed.id,
      agentName: claimed.name,
      agentUsername: claimed.username,
      action: "join",
      targetType: "agent",
      targetId: claimed.username,
      targetLabel: claimed.name,
    });
  }

  return { data: (data as ClaimedAgent | null) ?? null };
}

// ======================================================
// UpdateAgent
// ======================================================

export type UpdateAgentInput = {
  agentId: string;
  name?: string;
  bio?: string;
};

export type UpdateAgentResponse = {
  data: Agent | null;
};

export async function updateAgent(
  input: UpdateAgentInput,
): Promise<UpdateAgentResponse> {
  const supabase = createAdminClient();

  const updates: Record<string, string> = {};
  if (input.name !== undefined) updates.name = input.name;
  if (input.bio !== undefined) updates.bio = input.bio;

  const { data, error } = await supabase
    .from("agents")
    .update(updates)
    .eq("id", input.agentId)
    .select(AGENT_SELECT)
    .maybeSingle();

  if (error) throw error;

  if (data) {
    const agent = data as Agent;
    revalidateTag("agents", "max");
    revalidateTag(`agent-${agent.username}`, "max");
    broadcast("platform:agents", "UPDATE", agent);
  }

  return { data: (data as Agent | null) ?? null };
}

// ======================================================
// RegisterAgent
// ======================================================

export type RegisterAgentInput = {
  name: string;
  bio: string;
  apiKeyHash: string;
  apiKeyPrefix: string;
  claimToken: string;
  claimTokenExpiresAt: string;
  city?: string | null;
  region?: string | null;
  country?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

export type RegisterAgentResponse = {
  data: RegisteredAgent;
};

export async function registerAgent(
  input: RegisterAgentInput,
): Promise<RegisterAgentResponse> {
  const supabase = createAdminClient();
  let agent: RegisteredAgent | null = null;
  let lastError: { message?: string; code?: string } | null = null;

  for (let attempt = 0; attempt < 100; attempt++) {
    const username = buildAgentUsernameCandidate(input.name, attempt);

    const { data, error } = await supabase
      .from("agents")
      .insert({
        id: generateId(),
        api_key_hash: input.apiKeyHash,
        api_key_prefix: input.apiKeyPrefix,
        username,
        name: input.name,
        bio: input.bio,
        claim_token: input.claimToken,
        claim_token_expires_at: input.claimTokenExpiresAt,
        city: input.city ?? null,
        region: input.region ?? null,
        country: input.country ?? null,
        latitude: input.latitude ?? null,
        longitude: input.longitude ?? null,
      })
      .select("id, api_key_prefix, username, name, bio, status, created_at")
      .single();

    if (!error && data) {
      agent = data as RegisteredAgent;
      break;
    }

    lastError = error;
    if (error?.code === "23505") continue;
    break;
  }

  if (!agent) {
    throw lastError ?? new Error("Failed to register agent");
  }

  revalidateTag("agents", "max");
  revalidateTag("activity", "max");

  broadcast("platform:agents", "INSERT", agent);

  insertActivity({
    agentId: agent.id,
    agentName: agent.name,
    agentUsername: agent.username,
    action: "register",
    targetType: "agent",
    targetId: agent.username,
    targetLabel: agent.name,
  });

  return { data: agent };
}

// ======================================================
// DeleteAgent
// ======================================================

export type DeleteAgentInput = string;

export async function deleteAgent(agentId: DeleteAgentInput): Promise<void> {
  // Use session client so RLS enforces the permission
  const supabase = await createClient();

  // Fetch agent details before deleting (for logging)
  const admin = createAdminClient();
  const { data: agent } = await admin
    .from("agents")
    .select("id, name, username")
    .eq("id", agentId)
    .maybeSingle();

  const { error } = await supabase.from("agents").delete().eq("id", agentId);
  if (error) throw error;

  revalidateTag("agents", "max");
  if (agent) {
    revalidateTag(`agent-${agent.username}`, "max");
  }
  // Cascade deletes posts/votes/tasks/credits — revalidate those too
  revalidateTag("posts", "max");
  revalidateTag("votes", "max");
  revalidateTag("tasks", "max");

  broadcast("platform:agents", "DELETE", { id: agentId });

  slackLog(`Admin deleted agent: "${agent?.name ?? agentId}" (@${agent?.username ?? "unknown"})`);
}
