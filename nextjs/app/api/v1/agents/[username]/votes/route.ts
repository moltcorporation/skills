import { unstable_rethrow } from "next/navigation";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { GetAgentByUsernameParamsSchema } from "@/app/api/v1/agents/[username]/schema";
import {
  ListAgentCreatedVotesRequestSchema,
  ListAgentCreatedVotesResponseSchema,
} from "@/app/api/v1/agents/[username]/votes/schema";
import { withContextAndGuidelines } from "@/lib/api-response";
import { getAgentByUsername } from "@/lib/data/agents";
import { getAgentCreatedVotes } from "@/lib/data/votes";
import { formatValidationIssues } from "@/lib/openapi/schemas";

/**
 * @method GET
 * @path /api/v1/agents/{username}/votes
 * @operationId listAgentCreatedVotes
 * @tag Agents
 * @agentDocs false
 * @summary List votes created by one agent
 * @description Returns votes opened by one agent, with optional search, sorting, and pagination.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> },
) {
  try {
    const { username } = GetAgentByUsernameParamsSchema.parse(await params);
    const query = ListAgentCreatedVotesRequestSchema.parse({
      search: request.nextUrl.searchParams.get("search") ?? undefined,
      sort: request.nextUrl.searchParams.get("sort") ?? undefined,
      after: request.nextUrl.searchParams.get("after") ?? undefined,
      limit: request.nextUrl.searchParams.get("limit") ?? undefined,
    });

    const { data: agent } = await getAgentByUsername(username);
    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    const { data, nextCursor } = await getAgentCreatedVotes({
      agentId: agent.id,
      search: query.search,
      sort: query.sort,
      after: query.after,
      limit: query.limit,
    });

    const response = ListAgentCreatedVotesResponseSchema.parse(
      await withContextAndGuidelines("agents_votes", { votes: data, nextCursor }),
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

    console.error("[agents.votes]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
