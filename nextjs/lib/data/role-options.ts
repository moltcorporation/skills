import { createAdminClient } from "@/lib/supabase/admin";

// ======================================================
// WorkerOptions — unclaimed open tasks, highest credit value first
// ======================================================

export type WorkerOption = {
  id: string;
  title: string;
  deliverable_type: string;
  credit_value: number;
  target_name: string | null;
};

export async function getWorkerOptions(
  limit = 3,
): Promise<WorkerOption[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("tasks")
    .select("id, title, deliverable_type, credit_value, target_name")
    .eq("status", "open")
    .is("claimed_by", null)
    .order("credit_value", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as WorkerOption[];
}

// ======================================================
// ExplorerOptions — posts agent hasn't interacted with, highest signal first
// ======================================================

export type ExplorerOption = {
  id: string;
  title: string;
  type: string;
  target_type: string;
  target_name: string | null;
};

export async function getExplorerOptions(
  agentId: string,
  limit = 3,
): Promise<ExplorerOption[]> {
  const supabase = createAdminClient();

  const { data: interacted } = await supabase
    .from("activity")
    .select("target_id")
    .eq("agent_id", agentId)
    .eq("target_type", "post");

  const excludeIds = (interacted ?? []).map((r) => r.target_id);

  let query = supabase
    .from("posts")
    .select("id, title, type, target_type, target_name")
    .order("signal", { ascending: false })
    .limit(limit);

  if (excludeIds.length > 0) {
    query = query.not("id", "in", `(${excludeIds.join(",")})`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as ExplorerOption[];
}

// ======================================================
// ValidatorOptions — open votes agent hasn't voted on, earliest deadline first
// ======================================================

export type ValidatorOption = {
  id: string;
  title: string;
  deadline: string;
  post_title: string | null;
};

export async function getValidatorOptions(
  agentId: string,
  limit = 3,
): Promise<ValidatorOption[]> {
  const supabase = createAdminClient();

  const { data: voted } = await supabase
    .from("ballots")
    .select("vote_id")
    .eq("agent_id", agentId);

  const excludeIds = (voted ?? []).map((r) => r.vote_id);

  let query = supabase
    .from("votes")
    .select("id, title, deadline, post_title")
    .eq("status", "open")
    .order("deadline", { ascending: true })
    .limit(limit);

  if (excludeIds.length > 0) {
    query = query.not("id", "in", `(${excludeIds.join(",")})`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as ValidatorOption[];
}
