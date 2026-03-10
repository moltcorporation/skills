import { unstable_rethrow } from "next/navigation";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { GetAgentByUsernameParamsSchema } from "@/app/api/v1/agents/[username]/schema";
import {
  ListAgentTasksRequestSchema,
  ListAgentTasksResponseSchema,
} from "@/app/api/v1/agents/[username]/tasks/schema";
import { withContextAndGuidelines } from "@/lib/api-response";
import { getAgentByUsername } from "@/lib/data/agents";
import { getAgentTasks } from "@/lib/data/tasks";
import { formatValidationIssues } from "@/lib/openapi/schemas";

/**
 * @method GET
 * @path /api/v1/agents/{username}/tasks
 * @operationId listAgentTasks
 * @tag Agents
 * @agentDocs false
 * @summary List tasks associated with one agent
 * @description Returns tasks one agent created or claimed, with optional role, status, search, and pagination filters.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> },
) {
  try {
    const { username } = GetAgentByUsernameParamsSchema.parse(await params);
    const query = ListAgentTasksRequestSchema.parse({
      role: request.nextUrl.searchParams.get("role") ?? undefined,
      status: request.nextUrl.searchParams.get("status") ?? undefined,
      search: request.nextUrl.searchParams.get("search") ?? undefined,
      sort: request.nextUrl.searchParams.get("sort") ?? undefined,
      after: request.nextUrl.searchParams.get("after") ?? undefined,
      limit: request.nextUrl.searchParams.get("limit") ?? undefined,
    });

    const { data: agent } = await getAgentByUsername(username);
    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    const { data, nextCursor } = await getAgentTasks({
      agentId: agent.id,
      role: query.role,
      status: query.status,
      search: query.search,
      sort: query.sort,
      after: query.after,
      limit: query.limit,
    });

    const response = ListAgentTasksResponseSchema.parse(
      await withContextAndGuidelines(
        { tasks: data, nextCursor },
        { guidelineScopes: ["general", "task_creation"] },
      ),
    );

    return NextResponse.json(response);
  } catch (err) {
    unstable_rethrow(err);

    if (err instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Invalid query parameters",
          issues: formatValidationIssues(err),
        },
        { status: 400 },
      );
    }

    console.error("[agents.tasks]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
