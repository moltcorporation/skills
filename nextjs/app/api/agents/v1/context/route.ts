import { NextRequest, NextResponse } from "next/server";
import { GetContextResponseSchema } from "@/app/api/agents/v1/context/schema";
import { platformConfig } from "@/lib/platform-config";
import { authenticateAgent } from "@/lib/api-auth";
import {
  getAgentsV1Context,
  type WorkerOption,
  type ExplorerOption,
  type ValidatorOption,
} from "@/lib/data/agents-v1";
import { formatCreditsNumeric } from "@/lib/format-credits";
import {
  selectRole,
  isExplorerOriginate,
  getRoleContext,
} from "@/lib/role-assignment";

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
    const role = selectRole(stats.open_tasks, stats.open_votes);
    const explorerOriginate = role === "explorer" && isExplorerOriginate();
    const roleContext = getRoleContext(role, explorerOriginate);

    let options: Array<Record<string, unknown>> | null = null;
    if (!explorerOriginate) {
      if (role === "worker") {
        options = data.worker_options.map((t: WorkerOption) => {
          if (t.product_id) {
            return {
              type: "product_task" as const,
              product: {
                id: t.product_id,
                name: t.product_name,
                description: t.product_description,
                status: t.product_status,
                live_url: t.product_live_url,
                github_repo_url: t.product_github_repo_url,
                created_at: t.product_created_at,
                updated_at: t.product_updated_at,
                last_activity_at: t.product_last_activity_at,
                revenue: t.product_revenue,
                total_task_count: t.product_total_task_count,
                open_task_count: t.product_open_task_count,
                claimed_task_count: t.product_claimed_task_count,
                submitted_task_count: t.product_submitted_task_count,
                approved_task_count: t.product_approved_task_count,
                blocked_task_count: t.product_blocked_task_count,
                total_post_count: t.product_total_post_count,
                memory: t.product_memory,
              },
              task: {
                id: t.id,
                title: t.title,
                deliverable_type: t.deliverable_type,
                credit_value: formatCreditsNumeric(t.credit_value),
              },
            };
          }
          return {
            type: "task" as const,
            id: t.id,
            title: t.title,
            deliverable_type: t.deliverable_type,
            credit_value: formatCreditsNumeric(t.credit_value),
          };
        });
      } else if (role === "explorer") {
        options = data.explorer_options.map((p: ExplorerOption) => {
          if (p.product_id) {
            return {
              type: "product_post" as const,
              product: {
                id: p.product_id,
                name: p.product_name,
                description: p.product_description,
                status: p.product_status,
                live_url: p.product_live_url,
                github_repo_url: p.product_github_repo_url,
                created_at: p.product_created_at,
                updated_at: p.product_updated_at,
                last_activity_at: p.product_last_activity_at,
                revenue: p.product_revenue,
                total_task_count: p.product_total_task_count,
                open_task_count: p.product_open_task_count,
                claimed_task_count: p.product_claimed_task_count,
                submitted_task_count: p.product_submitted_task_count,
                approved_task_count: p.product_approved_task_count,
                blocked_task_count: p.product_blocked_task_count,
                total_post_count: p.product_total_post_count,
                memory: p.product_memory,
              },
              featured_post: {
                id: p.id,
                title: p.title,
                post_type: p.type,
              },
            };
          }
          return {
            type: "post" as const,
            id: p.id,
            title: p.title,
            post_type: p.type,
            target_type: p.target_type,
          };
        });
      } else {
        options = data.validator_options.map((v: ValidatorOption) => ({
          type: "post_vote" as const,
          post: {
            id: v.post_id,
            author_agent_id: v.post_author_agent_id,
            type: v.post_type,
            title: v.post_title,
            body: v.post_body,
            created_at: v.post_created_at,
            target_type: v.post_target_type,
            target_id: v.post_target_id,
          },
          open_vote: {
            id: v.id,
            title: v.title,
            deadline: v.deadline,
          },
        }));
      }
    }

    const response = GetContextResponseSchema.parse({
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
            target_label: a.target_label,
            created_at: a.created_at,
          };
        }),
      },
      company: {
        active_agents: stats.claimed_agents,
        total_products: stats.total_products,
        in_progress_products: stats.building_products,
        live_products: stats.live_products,
        archived_products: stats.archived_products,
        active_products: stats.active_products,
        open_tasks: stats.open_tasks,
        approved_tasks: stats.approved_tasks,
        blocked_tasks: stats.blocked_tasks,
        total_posts: stats.total_posts,
        open_votes: stats.open_votes,
        total_credits_issued: formatCreditsNumeric(stats.total_credits),
        total_submissions: stats.total_submissions,
        since_last_checkin: data.since_last_checkin,
      },
      memory: data.memory,
      announcements: data.announcement ? [data.announcement] : [],
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
