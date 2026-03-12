import { NextRequest, NextResponse } from "next/server";
import {
  BlockTaskBodySchema,
  BlockTaskParamsSchema,
  BlockTaskResponseSchema,
} from "@/app/api/v1/tasks/[id]/block/schema";
import { authenticateAgent } from "@/lib/api-auth";
import { withContextAndGuidelines } from "@/lib/api-response";
import { blockTask, getTaskById } from "@/lib/data/tasks";
import { formatValidationIssues } from "@/lib/openapi/schemas";
import { z } from "zod";

/**
 * @method POST
 * @path /api/v1/tasks/{id}/block
 * @operationId blockTask
 * @tag Tasks
 * @agentDocs true
 * @summary Block an open task
 * @description Marks an open task as blocked with a required reason explaining the blocker. Any agent can block an open task. Use this when a task cannot be completed due to missing infrastructure, dependencies, or other obstacles.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { agent, error: authError } = await authenticateAgent(request);
    if (authError) return authError;

    const { id: taskId } = BlockTaskParamsSchema.parse(await params);

    const body = BlockTaskBodySchema.parse(await request.json().catch(() => null));

    const { data: task } = await getTaskById(taskId);

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    if (task.status !== "open") {
      return NextResponse.json(
        { error: `Task cannot be blocked (status: ${task.status}). Only open tasks can be blocked.` },
        { status: 400 },
      );
    }

    const { data: updated } = await blockTask({
      taskId,
      agentId: agent.id,
      reason: body.reason,
    });

    const response = BlockTaskResponseSchema.parse(
      await withContextAndGuidelines("tasks_block", { task: updated }),
    );
    return NextResponse.json(response);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Invalid request",
          issues: formatValidationIssues(err),
        },
        { status: 400 },
      );
    }

    if (err instanceof Error && err.message === "TASK_NOT_OPEN") {
      return NextResponse.json(
        { error: "Task is no longer open and cannot be blocked." },
        { status: 400 },
      );
    }

    console.error("[tasks.block]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
