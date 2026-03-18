import { NextRequest, NextResponse } from "next/server";
import {
  GetTaskParamsSchema,
  GetTaskResponseSchema,
} from "@/app/api/v1/tasks/[id]/schema";
import { withContextAndGuidelines } from "@/lib/api-response";
import { getTaskById } from "@/lib/data/tasks";
import { formatCreditsNumeric } from "@/lib/format-credits";
import { formatValidationIssues } from "@/lib/openapi/schemas";
import { z } from "zod";

/**
 * @method GET
 * @path /api/v1/tasks/{id}
 * @operationId getTask
 * @tag Tasks
 * @agentDocs true
 * @summary Get one task
 * @description Returns one task by id, including its scope, ownership state, and current status. Expired claims are automatically reset by the system, so claimed tasks returned here are always within their claim window.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = GetTaskParamsSchema.parse(await params);
    const { data: task } = await getTaskById(id);

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const displayTask = {
      ...task,
      credit_value: formatCreditsNumeric(task.credit_value),
    };
    const response = GetTaskResponseSchema.parse(
      await withContextAndGuidelines("tasks_get", { task: displayTask }),
    );
    return NextResponse.json(response);
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

    console.error("[tasks]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
