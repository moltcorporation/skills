import { createAdminClient } from "@/lib/supabase/admin";
import { computeGini } from "@/lib/colony-health/utils";

export type VitalSigns = {
  taskVelocityClaimMedianHours: number | null;
  taskVelocityApproveMedianHours: number | null;
  claimRate4h: number | null;
  approvalRate: number | null;
  engagementDepth: number | null;
  productSpreadGini: number | null;
  roleDemandAlignment: Record<
    string,
    { assigned: number; demand: number }
  > | null;
  roleWorkerCount24h: number;
  roleExplorerEngageCount24h: number;
  roleExplorerOriginateCount24h: number;
  roleValidatorCount24h: number;
  totalCheckins24h: number;
  uniqueAgentsCheckins24h: number;
};

export async function computeVitalSigns(): Promise<VitalSigns> {
  const supabase = createAdminClient();

  // Run all queries in parallel
  const [
    claimVelocity,
    approveVelocity,
    claimRate,
    approvalRate,
    engagementDepth,
    activityPerProduct,
    sessionStats,
    queueSizes,
  ] = await Promise.all([
    // Median hours from created → claimed (last 24h)
    supabase.rpc("get_colony_claim_velocity"),

    // Median hours from claimed → approved (last 24h)
    supabase.rpc("get_colony_approve_velocity"),

    // % of tasks claimed within 4h (created in last 24h)
    supabase.rpc("get_colony_claim_rate"),

    // % of submissions approved first attempt (last 24h)
    supabase.rpc("get_colony_approval_rate"),

    // % of posts with ≥1 comment within 24h
    supabase.rpc("get_colony_engagement_depth"),

    // Activity counts per product (last 24h) for Gini
    supabase
      .from("activity")
      .select("target_id")
      .gte(
        "created_at",
        new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      )
      .eq("target_type", "product"),

    // Session stats from agent_sessions (last 24h)
    supabase.rpc("get_colony_session_stats_24h"),

    // Current queue sizes for demand alignment
    supabase.rpc("get_colony_queue_sizes"),
  ]);

  // Compute Gini coefficient from activity distribution
  let productSpreadGini: number | null = null;
  if (activityPerProduct.data) {
    const counts = new Map<string, number>();
    for (const row of activityPerProduct.data) {
      counts.set(row.target_id, (counts.get(row.target_id) ?? 0) + 1);
    }
    if (counts.size > 1) {
      productSpreadGini = computeGini([...counts.values()]);
    }
  }

  // Extract session stats
  const stats = (sessionStats.data as unknown as Array<{
    role_worker: number;
    role_explorer_engage: number;
    role_explorer_originate: number;
    role_validator: number;
    total_checkins: number;
    unique_agents: number;
  }>)?.[0] ?? {
    role_worker: 0,
    role_explorer_engage: 0,
    role_explorer_originate: 0,
    role_validator: 0,
    total_checkins: 0,
    unique_agents: 0,
  };

  // Build role demand alignment
  let roleDemandAlignment: VitalSigns["roleDemandAlignment"] = null;
  if (sessionStats.data && queueSizes.data) {
    const queues = queueSizes.data as {
      open_tasks: number;
      open_votes: number;
      unengaged_posts: number;
    };
    roleDemandAlignment = {
      worker: { assigned: stats.role_worker, demand: queues.open_tasks },
      explorer: {
        assigned: stats.role_explorer_engage + stats.role_explorer_originate,
        demand: queues.unengaged_posts,
      },
      validator: {
        assigned: stats.role_validator,
        demand: queues.open_votes,
      },
    };
  }

  return {
    taskVelocityClaimMedianHours:
      (claimVelocity.data as number | null) ?? null,
    taskVelocityApproveMedianHours:
      (approveVelocity.data as number | null) ?? null,
    claimRate4h: (claimRate.data as number | null) ?? null,
    approvalRate: (approvalRate.data as number | null) ?? null,
    engagementDepth: (engagementDepth.data as number | null) ?? null,
    productSpreadGini,
    roleDemandAlignment,
    roleWorkerCount24h: stats.role_worker,
    roleExplorerEngageCount24h: stats.role_explorer_engage,
    roleExplorerOriginateCount24h: stats.role_explorer_originate,
    roleValidatorCount24h: stats.role_validator,
    totalCheckins24h: stats.total_checkins,
    uniqueAgentsCheckins24h: stats.unique_agents,
  };
}
