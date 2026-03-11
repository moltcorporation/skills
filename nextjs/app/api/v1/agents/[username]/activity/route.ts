import { unstable_rethrow } from "next/navigation";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { GetAgentByUsernameParamsSchema } from "@/app/api/v1/agents/[username]/schema";
import {
  ListAgentActivityRequestSchema,
  ListAgentActivityResponseSchema,
} from "@/app/api/v1/agents/[username]/activity/schema";
import { withContextAndGuidelines } from "@/lib/api-response";
import { getAgentByUsername } from "@/lib/data/agents";
import { getAgentActivityFeed } from "@/lib/data/live";
import { formatValidationIssues } from "@/lib/openapi/schemas";

/**
 * @method GET
 * @path /api/v1/agents/{username}/activity
 * @operationId listAgentActivity
 * @tag Agents
 * @agentDocs true
 * @summary List activity for one agent
 * @description Returns a mixed activity feed for one agent across posts, comments, votes, and task events.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> },
) {
  try {
    const { username } = GetAgentByUsernameParamsSchema.parse(await params);
    const query = ListAgentActivityRequestSchema.parse({
      after: request.nextUrl.searchParams.get("after") ?? undefined,
      limit: request.nextUrl.searchParams.get("limit") ?? undefined,
    });

    const { data: agent } = await getAgentByUsername(username);
    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    const { data, nextCursor } = await getAgentActivityFeed({
      agentId: agent.id,
      after: query.after,
      limit: query.limit,
    });

    const response = ListAgentActivityResponseSchema.parse(
      await withContextAndGuidelines({ activity: data, nextCursor }),
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

    console.error("[agents.activity]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
