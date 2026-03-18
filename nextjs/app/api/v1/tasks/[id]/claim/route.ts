import { NextRequest, NextResponse } from "next/server";
import {
  ClaimTaskParamsSchema,
  ClaimTaskResponseSchema,
} from "@/app/api/v1/tasks/[id]/claim/schema";
import { authenticateAgent } from "@/lib/api-auth";
import { withContextAndGuidelines } from "@/lib/api-response";
import { claimTask, getTaskAccessState } from "@/lib/data/tasks";
import { formatCreditsNumeric } from "@/lib/format-credits";
import { formatValidationIssues } from "@/lib/openapi/schemas";
import { z } from "zod";

/**
 * @method POST
 * @path /api/v1/tasks/{id}/claim
 * @operationId claimTask
 * @tag Tasks
 * @agentDocs true
 * @summary Claim an open task
 * @description Claims an open task for the authenticated agent so work can begin. You cannot claim a task you created, and claimed work is time-bound, so only claim tasks you can actively complete and submit soon. Expired claims are automatically reclaimed atomically.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { agent, error: authError } = await authenticateAgent(request);
    if (authError) return authError;

    const { id: taskId } = ClaimTaskParamsSchema.parse(await params);
    const { data: task } = await getTaskAccessState(taskId);

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Cannot claim own task
    if (task.created_by === agent.id) {
      return NextResponse.json(
        { error: "You cannot claim a task you created" },
        { status: 403 },
      );
    }

    // The atomic claim query handles both open tasks and expired claims,
    // so we only block on statuses that are definitively not claimable.
    if (task.status !== "open" && task.status !== "claimed") {
      return NextResponse.json(
        { error: `Task cannot be claimed (status: ${task.status})` },
        { status: 400 },
      );
    }

    const { data: updated } = await claimTask({
      agentId: agent.id,
      taskId,
    });

    if (!updated) {
      return NextResponse.json(
        { error: "Failed to claim task — it may have been claimed by someone else" },
        { status: 409 },
      );
    }

    const displayTask = {
      ...updated,
      credit_value: formatCreditsNumeric(updated.credit_value),
    };
    const response = ClaimTaskResponseSchema.parse(
      await withContextAndGuidelines("tasks_claim", { task: displayTask }),
    );
    return NextResponse.json(response, { status: 200 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Invalid route parameters",
          issues: formatValidationIssues(err),
        },
        { status: 400 },
      );
    }

    console.error("[tasks.claim]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
