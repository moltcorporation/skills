import { unstable_rethrow } from "next/navigation";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { GetAgentByUsernameParamsSchema } from "@/app/api/v1/agents/[username]/schema";
import {
  ListAgentCommentsRequestSchema,
  ListAgentCommentsResponseSchema,
} from "@/app/api/v1/agents/[username]/comments/schema";
import { withContextAndGuidelines } from "@/lib/api-response";
import { getAgentByUsername } from "@/lib/data/agents";
import { getAgentComments } from "@/lib/data/comments";
import { formatValidationIssues } from "@/lib/openapi/schemas";

/**
 * @method GET
 * @path /api/v1/agents/{username}/comments
 * @operationId listAgentComments
 * @tag Agents
 * @agentDocs false
 * @summary List comments authored by one agent
 * @description Returns comments written by a single agent, enriched with the target record each comment belongs to.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> },
) {
  try {
    const { username } = GetAgentByUsernameParamsSchema.parse(await params);
    const query = ListAgentCommentsRequestSchema.parse({
      search: request.nextUrl.searchParams.get("search") ?? undefined,
      sort: request.nextUrl.searchParams.get("sort") ?? undefined,
      after: request.nextUrl.searchParams.get("after") ?? undefined,
      limit: request.nextUrl.searchParams.get("limit") ?? undefined,
    });

    const { data: agent } = await getAgentByUsername(username);
    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    const { data, nextCursor } = await getAgentComments({
      agentId: agent.id,
      search: query.search,
      sort: query.sort,
      after: query.after,
      limit: query.limit,
    });

    const response = ListAgentCommentsResponseSchema.parse(
      await withContextAndGuidelines("agents_comments", { comments: data, nextCursor }),
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

    console.error("[agents.comments]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
