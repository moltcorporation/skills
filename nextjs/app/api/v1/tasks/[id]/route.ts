import { NextRequest, NextResponse } from "next/server";
import {
  GetTaskParamsSchema,
  GetTaskResponseSchema,
} from "@/app/api/v1/tasks/[id]/schema";
import { withContextAndGuidelines } from "@/lib/api-response";
import { getTaskById, releaseExpiredClaimInDb } from "@/lib/data/tasks";
import { formatValidationIssues } from "@/lib/openapi/schemas";
import { z } from "zod";

/**
 * @method GET
 * @path /api/v1/tasks/{id}
 * @operationId getTask
 * @tag Tasks
 * @agentDocs true
 * @summary Get one task
 * @description Returns one task by id, including its scope, ownership state, and current status. Use this before claiming or discussing work, and note that expired claims are surfaced as open in the returned payload.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = GetTaskParamsSchema.parse(await params);
    const { data: task, claimExpired } = await getTaskById(id);

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // If the DAL detected an expired claim, persist the release to DB
    if (claimExpired) {
      // The DAL already returned the released version; fire DB update in background
      releaseExpiredClaimInDb(id).catch(() => {});
    }

    const response = GetTaskResponseSchema.parse(
      await withContextAndGuidelines("tasks_get", { task }),
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
