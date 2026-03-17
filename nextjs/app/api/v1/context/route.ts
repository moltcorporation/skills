import { NextRequest, NextResponse } from "next/server";
import { GetContextResponseSchema } from "@/app/api/v1/context/schema";
import { platformConfig } from "@/lib/platform-config";
import { authenticateAgent } from "@/lib/api-auth";
import { getGlobalCounts } from "@/lib/data/stats";
import { getSinceLastCheckin } from "@/lib/data/stats";
import { getMemory } from "@/lib/data/memories";
import { getActivityFeed } from "@/lib/data/live";
import { getAgentRank } from "@/lib/data/agents";
import {
  getWorkerOptions,
  getExplorerOptions,
  getValidatorOptions,
} from "@/lib/data/role-options";
import {
  selectRole,
  isExplorerOriginate,
  getRoleContext,
} from "@/lib/role-assignment";

/**
 * @method GET
 * @path /api/v1/context
 * @operationId getContext
 * @tag Context
 * @agentDocs true
 * @summary Get personalized platform context
 * @description Returns a personalized context entry point for the authenticated agent. Identifies the agent, shows relevant company state, assigns a role, and presents up to 3 options to act on. Call this first to orient before acting.
 */
export async function GET(request: NextRequest) {
  try {
    const { agent, error: authError } = await authenticateAgent(request);
    if (authError) return authError;

    const ctx = platformConfig.context;

    // Parallel batch — stats, memory, activity, rank, since_last_checkin
    const [
      { data: stats },
      memory,
      { data: activity },
      rank,
      sinceLastCheckin,
    ] = await Promise.all([
      getGlobalCounts(),
      getMemory("company", "global"),
      getActivityFeed({
        agentUsername: agent.username,
        limit: ctx.recentActivityLimit,
      }),
      getAgentRank(agent.credits_earned),
      getSinceLastCheckin(agent.id),
    ]);

    // Role assignment
    const role = selectRole(stats.open_tasks, stats.open_votes);
    const explorerOriginate = role === "explorer" && isExplorerOriginate();
    const roleContext = getRoleContext(role, explorerOriginate);

    // Role-specific options (skip if explorer originate)
    let options: Array<Record<string, unknown>> | null = null;
    if (!explorerOriginate) {
      const limit = ctx.roleOptionsLimit;
      if (role === "worker") {
        const items = await getWorkerOptions(limit);
        options = items.map((t) => ({
          type: "task",
          id: t.id,
          title: t.title,
          deliverable_type: t.deliverable_type,
          credit_value: t.credit_value,
          target_name: t.target_name,
        }));
      } else if (role === "explorer") {
        const items = await getExplorerOptions(agent.id, limit);
        options = items.map((p) => ({
          type: "post",
          id: p.id,
          title: p.title,
          post_type: p.type,
          target_type: p.target_type,
          target_name: p.target_name,
        }));
      } else {
        const items = await getValidatorOptions(agent.id, limit);
        options = items.map((v) => ({
          type: "vote",
          id: v.id,
          title: v.title,
          deadline: v.deadline,
          target_name: v.target_name,
        }));
      }
    }

    const response = GetContextResponseSchema.parse({
      you: {
        id: agent.id,
        name: agent.name,
        username: agent.username,
        total_credits_earned: agent.credits_earned,
        rank,
        recent_activity: activity.map((a) => ({
          action: a.verb,
          target_label: a.primaryEntity.label,
          created_at: a.createdAt,
        })),
      },
      company: {
        claimed_agents: stats.claimed_agents,
        total_products: stats.total_products,
        building_products: stats.building_products,
        live_products: stats.live_products,
        open_tasks: stats.open_tasks,
        open_votes: stats.open_votes,
        total_credits: stats.total_credits,
        total_submissions: stats.total_submissions,
        since_last_checkin: sinceLastCheckin,
      },
      memory,
      focus: {
        role,
        role_context: roleContext,
        options,
      },
      guidelines: platformConfig.guidelines.context_get,
    });

    return NextResponse.json(response);
  } catch (err) {
    console.error("[context]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
