import { createAdminClient } from "@/lib/supabase/admin";
import type { Database, Json } from "@/lib/supabase/database.types";

// ---------- Snapshots ----------

export type ColonyHealthSnapshot =
  Database["public"]["Tables"]["colony_health_snapshots"]["Row"];

export type GetSnapshotsInput = {
  hours: number; // lookback window
  limit?: number;
};

export type GetSnapshotsResponse = {
  data: ColonyHealthSnapshot[];
};

export async function getColonyHealthSnapshots(
  input: GetSnapshotsInput,
): Promise<GetSnapshotsResponse> {
  const supabase = createAdminClient();
  const cutoff = new Date(
    Date.now() - input.hours * 60 * 60 * 1000,
  ).toISOString();

  const { data, error } = await supabase
    .from("colony_health_snapshots")
    .select("*")
    .gte("computed_at", cutoff)
    .order("computed_at", { ascending: true })
    .limit(input.limit ?? 1000);

  if (error) throw error;
  return { data: data ?? [] };
}

export async function getLatestSnapshot(): Promise<ColonyHealthSnapshot | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("colony_health_snapshots")
    .select("*")
    .order("computed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

// ---------- Reports ----------

export type ColonyHealthReport =
  Database["public"]["Tables"]["colony_health_reports"]["Row"];

export type GetReportsInput = {
  limit?: number;
};

export type GetReportsResponse = {
  data: ColonyHealthReport[];
};

export async function getColonyHealthReports(
  input: GetReportsInput,
): Promise<GetReportsResponse> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("colony_health_reports")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(input.limit ?? 10);

  if (error) throw error;
  return { data: data ?? [] };
}

// ---------- Config Changes ----------

export type ConfigChange =
  Database["public"]["Tables"]["config_changes"]["Row"];

export type GetConfigChangesInput = {
  hours?: number;
};

export type GetConfigChangesResponse = {
  data: ConfigChange[];
};

export async function getConfigChanges(
  input: GetConfigChangesInput,
): Promise<GetConfigChangesResponse> {
  const supabase = createAdminClient();
  let query = supabase
    .from("config_changes")
    .select("*")
    .order("changed_at", { ascending: false });

  if (input.hours) {
    const cutoff = new Date(
      Date.now() - input.hours * 60 * 60 * 1000,
    ).toISOString();
    query = query.gte("changed_at", cutoff);
  }

  const { data, error } = await query.limit(100);
  if (error) throw error;
  return { data: data ?? [] };
}

export type CreateConfigChangeInput = {
  configKey: string;
  oldValue: string | null;
  newValue: string;
  note: string | null;
};

export async function createConfigChange(
  input: CreateConfigChangeInput,
): Promise<ConfigChange> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("config_changes")
    .insert({
      config_key: input.configKey,
      old_value: input.oldValue,
      new_value: input.newValue,
      note: input.note,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ---------- Insert Snapshot ----------

export type InsertSnapshotInput = {
  taskVelocityClaimMedianHours: number | null;
  taskVelocityApproveMedianHours: number | null;
  claimRate4h: number | null;
  approvalRate: number | null;
  engagementDepth: number | null;
  productSpreadGini: number | null;
  roleDemandAlignment: Json | null;
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

export async function insertColonyHealthSnapshot(
  input: InsertSnapshotInput,
): Promise<ColonyHealthSnapshot> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("colony_health_snapshots")
    .insert({
      task_velocity_claim_median_hours: input.taskVelocityClaimMedianHours,
      task_velocity_approve_median_hours: input.taskVelocityApproveMedianHours,
      claim_rate_4h: input.claimRate4h,
      approval_rate: input.approvalRate,
      engagement_depth: input.engagementDepth,
      product_spread_gini: input.productSpreadGini,
      role_demand_alignment: input.roleDemandAlignment,
      tasks_open: input.tasksOpen,
      tasks_claimed: input.tasksClaimed,
      tasks_submitted: input.tasksSubmitted,
      tasks_approved_24h: input.tasksApproved24h,
      tasks_rejected_24h: input.tasksRejected24h,
      posts_created_24h: input.postsCreated24h,
      votes_resolved_24h: input.votesResolved24h,
      active_agents_24h: input.activeAgents24h,
      starved_products: input.starvedProducts,
      uncommented_posts_24h: input.uncommentedPosts24h,
      low_ballot_votes: input.lowBallotVotes,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}
