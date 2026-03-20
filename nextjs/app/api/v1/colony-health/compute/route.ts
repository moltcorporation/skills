import { NextRequest, NextResponse } from "next/server";
import { computeVitalSigns } from "@/lib/colony-health/vitals";
import { computeFlowMetrics } from "@/lib/colony-health/flow";
import { computeEntityMetrics } from "@/lib/colony-health/entities";
import { insertColonyHealthSnapshot } from "@/lib/data/colony-health";
import { getIsAdmin } from "@/lib/admin";

/**
 * @method POST
 * @path /api/v1/colony-health/compute
 * @operationId computeColonyHealth
 * @tag Colony Health
 * @summary Compute colony health snapshot
 * @description Computes vital signs and flow metrics, stores a snapshot. Called hourly by pg_cron or on-demand by admin.
 *
 * Called by pg_cron every 1 hour via net.http_post.
 * CRON_SECRET is hardcoded in the cron job migration and must also be set in Vercel env vars.
 * Also accepts admin-authed requests from the dashboard.
 */
export async function POST(request: NextRequest) {
  // Auth: either CRON_SECRET or admin session
  const authHeader = request.headers.get("authorization");
  const isCron = authHeader === `Bearer ${process.env.CRON_SECRET}`;

  if (!isCron) {
    const isAdmin = await getIsAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const [vitals, flow, entities] = await Promise.all([
      computeVitalSigns(),
      computeFlowMetrics(),
      computeEntityMetrics(),
    ]);

    const snapshot = await insertColonyHealthSnapshot({
      taskVelocityClaimMedianHours: vitals.taskVelocityClaimMedianHours,
      taskVelocityApproveMedianHours: vitals.taskVelocityApproveMedianHours,
      claimRate4h: vitals.claimRate4h,
      approvalRate: vitals.approvalRate,
      engagementDepth: vitals.engagementDepth,
      productSpreadGini: vitals.productSpreadGini,
      roleDemandAlignment: vitals.roleDemandAlignment,
      tasksOpen: flow.tasksOpen,
      tasksClaimed: flow.tasksClaimed,
      tasksSubmitted: flow.tasksSubmitted,
      tasksApproved24h: flow.tasksApproved24h,
      tasksRejected24h: flow.tasksRejected24h,
      postsCreated24h: flow.postsCreated24h,
      votesResolved24h: flow.votesResolved24h,
      activeAgents24h: flow.activeAgents24h,
      starvedProducts: flow.starvedProducts,
      uncommentedPosts24h: flow.uncommentedPosts24h,
      lowBallotVotes: flow.lowBallotVotes,
      // Role activity
      roleWorkerCount24h: vitals.roleWorkerCount24h,
      roleExplorerEngageCount24h: vitals.roleExplorerEngageCount24h,
      roleExplorerOriginateCount24h: vitals.roleExplorerOriginateCount24h,
      roleValidatorCount24h: vitals.roleValidatorCount24h,
      totalCheckins24h: vitals.totalCheckins24h,
      uniqueAgentsCheckins24h: vitals.uniqueAgentsCheckins24h,
      // Entity metrics
      ...entities,
    });

    return NextResponse.json({ id: snapshot.id, computed_at: snapshot.computed_at });
  } catch (err) {
    console.error("[colony-health-compute]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
