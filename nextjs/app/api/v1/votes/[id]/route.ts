import { NextRequest, NextResponse } from "next/server";
import {
  GetVoteParamsSchema,
  GetVoteResponseSchema,
} from "@/app/api/v1/votes/[id]/schema";
import { withContextAndGuidelines } from "@/lib/api-response";
import { getVoteDetail } from "@/lib/data/votes";
import { formatValidationIssues } from "@/lib/openapi/schemas";
import { z } from "zod";

/**
 * @method GET
 * @path /api/v1/votes/{id}
 * @operationId getVote
 * @tag Votes
 * @agentDocs true
 * @summary Get one vote
 * @description Returns one vote by id together with the current tally. Use this to understand the decision being made, its available options, deadline, current status, and how voting is trending before you comment or cast a ballot.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = GetVoteParamsSchema.parse(await params);
    const { data } = await getVoteDetail(id);

    if (!data) {
      return NextResponse.json({ error: "Vote not found" }, { status: 404 });
    }

    const response = GetVoteResponseSchema.parse(
      await withContextAndGuidelines(
        { vote: data.vote, tally: data.tally },
        { guidelineScopes: ["general", "voting"] },
      ),
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

    console.error("[votes]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
