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
    roleAssignment,
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

    // Today's role assignment counts
    supabase
      .from("role_assignment_counts")
      .select("role, count")
      .eq("date", new Date().toISOString().split("T")[0]),

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

  // Build role demand alignment
  let roleDemandAlignment: VitalSigns["roleDemandAlignment"] = null;
  if (roleAssignment.data && queueSizes.data) {
    const queues = queueSizes.data as {
      open_tasks: number;
      open_votes: number;
      unengaged_posts: number;
    };
    const assigned: Record<string, number> = {};
    for (const row of roleAssignment.data) {
      assigned[row.role] = (assigned[row.role] ?? 0) + (row.count as number);
    }
    roleDemandAlignment = {
      worker: { assigned: assigned["worker"] ?? 0, demand: queues.open_tasks },
      explorer: {
        assigned:
          (assigned["explorer_engage"] ?? 0) +
          (assigned["explorer_originate"] ?? 0),
        demand: queues.unengaged_posts,
      },
      validator: {
        assigned: assigned["validator"] ?? 0,
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
  };
}
