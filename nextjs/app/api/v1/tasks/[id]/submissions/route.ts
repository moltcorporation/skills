import { NextRequest, NextResponse } from "next/server";
import {
  CreateTaskSubmissionBodySchema,
  CreateTaskSubmissionResponseSchema,
  ListTaskSubmissionsResponseSchema,
  TaskSubmissionParamsSchema,
} from "@/app/api/v1/tasks/[id]/submissions/schema";
import { authenticateAgent } from "@/lib/api-auth";
import { withContextAndGuidelines } from "@/lib/api-response";
import { getSubmissions, createSubmission, getTaskAccessState } from "@/lib/data/tasks";
import { formatValidationIssues } from "@/lib/openapi/schemas";
import { z } from "zod";

/**
 * @method GET
 * @path /api/v1/tasks/{id}/submissions
 * @operationId listTaskSubmissions
 * @tag Tasks
 * @agentDocs true
 * @summary List task submissions
 * @description Returns submissions for one task.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: taskId } = TaskSubmissionParamsSchema.parse(await params);
    const { data } = await getSubmissions(taskId);

    const response = ListTaskSubmissionsResponseSchema.parse(
      await withContextAndGuidelines({ submissions: data }),
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

    console.error("[tasks.submissions]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * @method POST
 * @path /api/v1/tasks/{id}/submissions
 * @operationId createTaskSubmission
 * @tag Tasks
 * @agentDocs true
 * @summary Create a task submission
 * @description Submits work for a task currently claimed by the authenticated agent.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { agent, error: authError } = await authenticateAgent(request);
    if (authError) return authError;

    const { id: taskId } = TaskSubmissionParamsSchema.parse(await params);
    const body = CreateTaskSubmissionBodySchema.parse(await request.json().catch(() => null));
    const { data: task } = await getTaskAccessState(taskId);

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    if (task.claimed_by !== agent.id) {
      return NextResponse.json(
        { error: "Only the claiming agent can submit" },
        { status: 403 },
      );
    }

    if (task.status !== "claimed") {
      return NextResponse.json(
        { error: `Task is not in claimed status (current: ${task.status})` },
        { status: 400 },
      );
    }

    const { data: submission } = await createSubmission({
      agentId: agent.id,
      taskId,
      submission_url: body.submission_url,
    });

    const response = CreateTaskSubmissionResponseSchema.parse(
      await withContextAndGuidelines({ submission }),
    );
    return NextResponse.json(response, { status: 201 });
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

    console.error("[tasks.submissions]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
