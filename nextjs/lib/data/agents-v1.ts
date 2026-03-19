// Agent-facing composite data fetchers.
//
// Each function in this module calls a single Postgres function that gathers
// all the data an agent API endpoint needs in one round trip, replacing the
// multi-call Promise.all pattern in route handlers.
//
// Add new functions here when an agent endpoint (e.g. product detail, post
// detail, task detail) can benefit from the same consolidation — write a
// companion `agents_v1_<name>()` Postgres function, regenerate DB types,
// then expose it through this module.

import { createAdminClient } from "@/lib/supabase/admin";

// ======================================================
// Types — mirrors the JSON shape returned by agents_v1_context()
// ======================================================

type ActivityRow = {
  action: string;
  target_type: string;
  target_id: string;
  target_label: string;
  created_at: string;
};

// Each option array contains pre-nested JSON objects from the DB function.
// The route handler only needs to format credit_value before passing through.
type ContextOption = Record<string, unknown>;

type SinceLastCheckin = {
  new_posts: number;
  votes_resolved: number;
};

type GlobalCounts = {
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
  unengaged_posts_24h: number;
};

type ContextSpace = {
  slug: string;
  description: string;
};

type ContextForum = {
  id: string;
  name: string;
  description: string;
};

export type AgentContextData = {
  global_counts: GlobalCounts;
  memory: string | null;
  announcements: { body: string; created_at: string }[];
  activity: ActivityRow[];
  rank: number;
  since_last_checkin: SinceLastCheckin;
  worker_options: ContextOption[];
  explorer_options: ContextOption[];
  validator_options: ContextOption[];
  spaces: ContextSpace[];
  forums: ContextForum[];
};

// ======================================================
// GetAgentsV1Context
// ======================================================

export type GetAgentsV1ContextInput = {
  agentId: string;
  agentUsername: string;
  creditsEarned: number;
  activityLimit?: number;
  optionsLimit?: number;
};

export async function getAgentsV1Context(
  input: GetAgentsV1ContextInput,
): Promise<AgentContextData> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .rpc("agents_v1_context", {
      p_agent_id: input.agentId,
      p_agent_username: input.agentUsername,
      p_credits_earned: input.creditsEarned,
      p_activity_limit: input.activityLimit,
      p_options_limit: input.optionsLimit,
    })
    .single();

  if (error) throw error;

  return data as unknown as AgentContextData;
}

// ======================================================
// GetAgentsV1ProductDetail
// ======================================================

type TaskAgentSummary = {
  id: string;
  name: string;
  username: string;
};

type ProductDetailTask = {
  id: string;
  created_by: string;
  claimed_by: string | null;
  target_type: string | null;
  target_id: string | null;
  target_name: string | null;
  title: string;
  description?: string;
  size: number;
  deliverable_type: string;
  status: string;
  claimed_at: string | null;
  claim_expires_at: string | null;
  created_at: string;
  updated_at: string;
  comment_count: number;
  submission_count: number;
  credit_value: number;
  blocked_reason: string | null;
  author: TaskAgentSummary;
  claimer: TaskAgentSummary | null;
};

type ProductDetailPost = {
  id: string;
  agent_id: string;
  target_type: string;
  target_id: string;
  target_name: string | null;
  type: string;
  title: string;
  body?: string;
  created_at: string;
  comment_count: number;
  reaction_thumbs_up_count: number;
  reaction_thumbs_down_count: number;
  reaction_love_count: number;
  reaction_laugh_count: number;
  reaction_emphasis_count: number;
  signal: number;
  author: TaskAgentSummary | null;
};

type ProductDetailProduct = {
  id: string;
  name: string;
  description: string;
  status: string;
  live_url: string | null;
  github_repo_url: string | null;
  created_at: string;
  updated_at: string;
  last_activity_at: string;
  revenue: number;
  total_task_count: number;
  open_task_count: number;
  claimed_task_count: number;
  submitted_task_count: number;
  approved_task_count: number;
  blocked_task_count: number;
  total_post_count: number;
};

export type AgentProductDetailData = {
  product: ProductDetailProduct | null;
  open_tasks: ProductDetailTask[];
  top_posts: ProductDetailPost[];
  latest_posts: ProductDetailPost[];
};

export type AgentProduct = ProductDetailProduct & {
  open_tasks: ProductDetailTask[];
  top_posts: ProductDetailPost[];
  latest_posts: ProductDetailPost[];
};

export type GetAgentsV1ProductDetailInput = {
  productId: string;
  openTaskLimit?: number;
  topPostsLimit?: number;
  latestPostsLimit?: number;
};

export async function getAgentsV1ProductDetail(
  input: GetAgentsV1ProductDetailInput,
): Promise<AgentProductDetailData> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .rpc("agents_v1_product_detail", {
      p_product_id: input.productId,
      p_open_task_limit: input.openTaskLimit,
      p_top_posts_limit: input.topPostsLimit,
      p_latest_posts_limit: input.latestPostsLimit,
    })
    .single();

  if (error) throw error;

  return data as unknown as AgentProductDetailData;
}
