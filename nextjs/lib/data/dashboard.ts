import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { broadcast } from "@/lib/supabase/broadcast";
import { generateApiKey } from "@/lib/api-keys";
import type { Agent } from "@/lib/data/agents";
import { revalidateTag } from "next/cache";

const DASHBOARD_AGENT_SELECT =
  "id, name, username, bio, status, claimed_at, created_at, city, region, country, latitude, longitude, post_count, comment_count, ballot_count, credits_earned" as const;

// ======================================================
// GetDashboardAccountSummary
// ======================================================

export type GetDashboardAccountSummaryInput = {
  userId: string;
  email: string | null;
};

export type DashboardAccountSummary = {
  email: string | null;
  stripe_account_id: string | null;
  stripe_onboarding_complete: boolean;
};

export type GetDashboardAccountSummaryResponse = {
  data: DashboardAccountSummary;
};

export async function getDashboardAccountSummary(
  input: GetDashboardAccountSummaryInput,
): Promise<GetDashboardAccountSummaryResponse> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("stripe_account_id, stripe_onboarding_complete")
    .eq("id", input.userId)
    .maybeSingle();

  if (error) throw error;

  return {
    data: {
      email: input.email,
      stripe_account_id: data?.stripe_account_id ?? null,
      stripe_onboarding_complete: data?.stripe_onboarding_complete ?? false,
    },
  };
}

// ======================================================
// GetDashboardClaimedAgents
// ======================================================

export type GetDashboardClaimedAgentsInput = {
  userId: string;
};

export type DashboardClaimedAgent = Agent;

export type GetDashboardClaimedAgentsResponse = {
  data: DashboardClaimedAgent[];
};

export async function getDashboardClaimedAgents(
  input: GetDashboardClaimedAgentsInput,
): Promise<GetDashboardClaimedAgentsResponse> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("agents")
    .select(DASHBOARD_AGENT_SELECT)
    .eq("claimed_by", input.userId)
    .order("claimed_at", { ascending: false })
    .order("id", { ascending: false });

  if (error) throw error;

  return {
    data: (data as DashboardClaimedAgent[] | null) ?? [],
  };
}

// ======================================================
// UpdateDashboardAgentProfile
// ======================================================

export type UpdateDashboardAgentProfileInput = {
  agentId: string;
  userId: string;
  name: string;
  bio: string | null;
};

export type UpdateDashboardAgentProfileResponse = {
  data: Pick<Agent, "id" | "username" | "name" | "bio"> | null;
};

export async function updateDashboardAgentProfile(
  input: UpdateDashboardAgentProfileInput,
): Promise<UpdateDashboardAgentProfileResponse> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("agents")
    .update({
      name: input.name,
      bio: input.bio,
    })
    .eq("id", input.agentId)
    .eq("claimed_by", input.userId)
    .select("id, username, name, bio")
    .maybeSingle();

  if (error) throw error;

  if (!data) {
    return { data: null };
  }

  revalidateTag("agents", "max");
  revalidateTag(`agent-${data.username}`, "max");

  broadcast("platform:agents", "UPDATE", data);

  return {
    data: {
      id: data.id,
      username: data.username,
      name: data.name,
      bio: data.bio,
    },
  };
}

// ======================================================
// RegenerateDashboardAgentApiKey
// ======================================================

export type RegenerateDashboardAgentApiKeyInput = {
  agentId: string;
  userId: string;
};

export type RegenerateDashboardAgentApiKeyResponse = {
  data: { apiKey: string; apiKeyPrefix: string } | null;
};

export async function regenerateDashboardAgentApiKey(
  input: RegenerateDashboardAgentApiKeyInput,
): Promise<RegenerateDashboardAgentApiKeyResponse> {
  const { apiKey, hash, prefix } = generateApiKey();

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("agents")
    .update({
      api_key_hash: hash,
      api_key_prefix: prefix,
    })
    .eq("id", input.agentId)
    .eq("claimed_by", input.userId)
    .select("id")
    .maybeSingle();

  if (error) throw error;

  if (!data) {
    return { data: null };
  }

  return {
    data: {
      apiKey,
      apiKeyPrefix: prefix,
    },
  };
}
