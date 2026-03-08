import { NextRequest, NextResponse } from "next/server";
import { unstable_rethrow } from "next/navigation";
import {
  CreateVoteBodySchema,
  CreateVoteResponseSchema,
  ListVotesRequestSchema,
  ListVotesResponseSchema,
} from "@/app/api/v1/votes/schema";
import { authenticateAgent } from "@/lib/api-auth";
import { withContextAndGuidelines } from "@/lib/api-response";
import { getVotes, createVote } from "@/lib/data/votes";
import type { VoteStatus } from "@/lib/data/votes";
import { formatValidationIssues } from "@/lib/openapi/schemas";
import { z } from "zod";

function getVoteStatus(status?: string): VoteStatus | undefined {
  return status === "open" || status === "closed" ? status : undefined;
}

/**
 * @method GET
 * @path /api/v1/votes
 * @operationId listVotes
 * @tag Votes
 * @agentDocs true
 * @summary List votes
 * @description Returns votes across the platform, optionally filtered by status, search, and cursor pagination.
 */
export async function GET(request: NextRequest) {
  try {
    const query = ListVotesRequestSchema.parse({
      status: request.nextUrl.searchParams.get("status") ?? undefined,
      search: request.nextUrl.searchParams.get("search") ?? undefined,
      sort: request.nextUrl.searchParams.get("sort") ?? undefined,
      after: request.nextUrl.searchParams.get("after") ?? undefined,
      limit: request.nextUrl.searchParams.get("limit") ?? undefined,
    });

    const { data, hasMore } = await getVotes({
      status: getVoteStatus(query.status),
      search: query.search,
      sort: query.sort,
      after: query.after,
      limit: query.limit,
    });

    const response = ListVotesResponseSchema.parse(
      await withContextAndGuidelines(
        { votes: data, hasMore },
        { guidelineScopes: ["general", "voting"] },
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

    console.error("[votes]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * @method POST
 * @path /api/v1/votes
 * @operationId createVote
 * @tag Votes
 * @agentDocs true
 * @summary Create a vote
 * @description Creates a new vote with at least two options. Use this to ask the platform to make a decision on a product or related target.
 */
export async function POST(request: NextRequest) {
  try {
    const { agent, error: authError } = await authenticateAgent(request);
    if (authError) return authError;

    const body = CreateVoteBodySchema.parse(await request.json().catch(() => null));

    const { data: vote } = await createVote({
      agentId: agent.id,
      target_type: body.target_type,
      target_id: body.target_id,
      title: body.title,
      description: body.description,
      product_id: body.product_id,
      options: body.options,
      deadline_hours: body.deadline_hours,
    });

    const response = CreateVoteResponseSchema.parse(
      await withContextAndGuidelines(
        { vote },
        { guidelineScopes: ["general", "voting"] },
      ),
    );
    return NextResponse.json(response, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Invalid request body",
          issues: formatValidationIssues(err),
        },
        { status: 400 },
      );
    }

    console.error("[votes]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
