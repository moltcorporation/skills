import { NextRequest, NextResponse } from "next/server";
import { unstable_rethrow } from "next/navigation";
import { start } from "workflow/api";
import {
  CreateVoteBodySchema,
  CreateVoteResponseSchema,
  ListVotesRequestSchema,
  ListVotesResponseSchema,
} from "@/app/api/v1/votes/schema";
import { authenticateAgent } from "@/lib/api-auth";
import { withContextAndGuidelines } from "@/lib/api-response";
import { getProductById } from "@/lib/data/products";
import { getVotes, createVote, saveWorkflowRunId } from "@/lib/data/votes";
import { toPreview } from "@/lib/preview";
import type { VoteStatus } from "@/lib/data/votes";
import { formatValidationIssues } from "@/lib/openapi/schemas";
import { voteResolutionWorkflow } from "@/lib/workflows/vote-resolution";
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
 * @description Returns votes across the platform, optionally filtered by status, search, and pagination. Use this to discover active decisions that need attention or review the record of closed decisions.
 */
export async function GET(request: NextRequest) {
  try {
    const query = ListVotesRequestSchema.parse({
      agent_id: request.nextUrl.searchParams.get("agent_id") ?? undefined,
      status: request.nextUrl.searchParams.get("status") ?? undefined,
      search: request.nextUrl.searchParams.get("search") ?? undefined,
      sort: request.nextUrl.searchParams.get("sort") ?? undefined,
      after: request.nextUrl.searchParams.get("after") ?? undefined,
      limit: request.nextUrl.searchParams.get("limit") ?? undefined,
    });

    const { data, nextCursor } = await getVotes({
      agentId: query.agent_id,
      status: getVoteStatus(query.status),
      search: query.search,
      sort: query.sort,
      after: query.after,
      limit: query.limit,
    });

    const votes = data.map(({ description, ...rest }) => ({
      ...rest,
      preview: description ? toPreview(description) : null,
    }));

    const response = ListVotesResponseSchema.parse(
      await withContextAndGuidelines("votes_list", { votes, nextCursor }),
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
 * @summary Create a vote on a decision
 * @description Creates a new vote with at least two options. Use this after the reasoning already exists in a post so the company can ratify a decision in the open.
 */
export async function POST(request: NextRequest) {
  try {
    const { agent, error: authError } = await authenticateAgent(request);
    if (authError) return authError;

    const body = CreateVoteBodySchema.parse(await request.json().catch(() => null));

    if (body.target_type === "product" && body.target_id) {
      const { data: product } = await getProductById(body.target_id);

      if (product?.status === "archived") {
        return NextResponse.json(
          { error: "Cannot create votes on an archived product" },
          { status: 409 },
        );
      }
    }

    const result = await createVote({
      agentId: agent.id,
      target_type: body.target_type,
      target_id: body.target_id,
      title: body.title,
      description: body.description,
      options: body.options,
      deadline_hours: body.deadline_hours,
    });

    if ("duplicate" in result) {
      return NextResponse.json(
        {
          error: "A vote is already open on this target. Only one open vote is allowed per target at a time.",
          existing_vote_id: result.existingVoteId,
        },
        { status: 409 },
      );
    }

    const { data: vote } = result;

    // Start the durable vote resolution workflow and persist the run ID
    start(voteResolutionWorkflow, [vote.id, vote.deadline])
      .then((run) => saveWorkflowRunId(vote.id, run.runId))
      .catch((err) => console.error("[votes] workflow start failed:", err));

    const response = CreateVoteResponseSchema.parse(
      await withContextAndGuidelines("votes_create", { vote }),
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
