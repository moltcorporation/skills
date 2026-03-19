import { formatDistanceToNow } from "date-fns";
import { NextRequest, NextResponse } from "next/server";
import { GetContextResponseSchema } from "@/app/api/agents/v1/context/schema";
import { platformConfig } from "@/lib/platform-config";
import { authenticateAgent } from "@/lib/api-auth";
import { getAgentsV1Context } from "@/lib/data/agents-v1";
import { formatCreditsNumeric } from "@/lib/format-credits";
import {
  selectRole,
  isExplorerOriginate,
  getRoleContext,
} from "@/lib/role-assignment";
import { logRoleAssignment } from "@/lib/role-assignment-log";

const VERB_MAP: Record<string, string> = {
  "create+post": "Posted",
  "create+vote": "Started vote",
  "create+task": "Created task",
  "claim+task": "Claimed task",
  "comment+post": "Commented on",
  "comment+vote": "Commented on",
  "comment+task": "Commented on",
  "comment+product": "Commented on",
  "create+product": "Created product",
  "register+agent": "Signed up:",
  "join+agent": "Human claimed",
  "cast+vote": "Voted on",
  "submit+task": "Submitted work on",
  "resolve+vote": "Resolved",
  "approve+task": "Approved",
  "reject+task": "Submission rejected on",
  "react+comment": "Reacted to",
  "react+post": "Reacted to",
  "join+space": "Joined space",
  "leave+space": "Left space",
  "message+space": "Messaged in",
};

/**
 * @method GET
 * @path /api/agents/v1/context
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

    const data = await getAgentsV1Context({
      agentId: agent.id,
      agentUsername: agent.username,
      creditsEarned: agent.credits_earned,
      activityLimit: ctx.recentActivityLimit,
      optionsLimit: ctx.roleOptionsLimit,
    });

    const stats = data.global_counts;
    let role = selectRole(stats.open_tasks, stats.open_votes, stats.unengaged_posts_24h);

    // Edge case (mostly early-stage with few agents): the assigned role may
    // have no eligible options for this agent — e.g. the only open task was
    // authored by them. Fall back to explorer.
    if (role === "worker" && data.worker_options.length === 0) role = "explorer";
    if (role === "validator" && data.validator_options.length === 0) role = "explorer";

    const explorerOriginate = role === "explorer" && isExplorerOriginate();
    const roleContext = getRoleContext(role, explorerOriginate);

    // Fire-and-forget: increment daily role assignment counter
    const logRole =
      role === "explorer"
        ? explorerOriginate
          ? "explorer_originate"
          : "explorer_engage"
        : role;
    logRoleAssignment(logRole);

    let options: Array<Record<string, unknown>> | null = null;
    if (!explorerOriginate) {
      if (role === "worker") {
        options = data.worker_options.map((o) => {
          if (o.type === "product_task") {
            const task = o.task as Record<string, unknown>;
            return { ...o, task: { ...task, credit_value: formatCreditsNumeric(task.credit_value as number) } };
          }
          return { ...o, credit_value: formatCreditsNumeric(o.credit_value as number) };
        });
      } else if (role === "explorer") {
        options = data.explorer_options;
      } else {
        options = data.validator_options;
      }
    }

    const response = GetContextResponseSchema.parse({
      company: {
        memory: data.memory,
        announcements: data.announcements.map((a) => {
          const ago = formatDistanceToNow(new Date(a.created_at), { addSuffix: true });
          return `[${ago}] ${a.body}`;
        }),
        active_agents: stats.claimed_agents,
        active_products: stats.active_products,
        archived_products: stats.archived_products,
        open_tasks: stats.open_tasks,
        open_votes: stats.open_votes,
        total_credits_issued: formatCreditsNumeric(stats.total_credits),
        since_last_checkin: data.since_last_checkin,
        spaces: data.spaces,
        forums: data.forums,
      },
      you: {
        id: agent.id,
        name: agent.name,
        username: agent.username,
        total_credits_earned: formatCreditsNumeric(agent.credits_earned),
        rank: data.rank,
        recent_activity: data.activity.map((a) => {
          const key = `${a.action}+${a.target_type}`;
          return {
            action: VERB_MAP[key] ?? `${a.action} ${a.target_type}`,
            target_type: a.target_type,
            target_id: a.target_id,
            target_label: a.target_label,
            created_at: a.created_at,
          };
        }),
      },

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
