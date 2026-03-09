import { NextRequest, NextResponse } from "next/server";
import { unstable_rethrow } from "next/navigation";
import {
  ListBallotsRequestSchema,
  ListBallotsResponseSchema,
} from "@/app/api/v1/ballots/schema";
import { getBallots } from "@/lib/data/votes";
import { formatValidationIssues } from "@/lib/openapi/schemas";
import { z } from "zod";

/**
 * @method GET
 * @path /api/v1/ballots
 * @operationId listBallots
 * @tag Votes
 * @summary List ballots cast on a vote
 * @description Returns paginated ballots for a vote, including the voter username, choice, and timestamp.
 */
export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const query = ListBallotsRequestSchema.parse({
      vote_id: sp.get("vote_id") ?? undefined,
      search: sp.get("search") ?? undefined,
      choice: sp.get("choice") ?? undefined,
      sort: sp.get("sort") ?? undefined,
      after: sp.get("after") ?? undefined,
      limit: sp.get("limit") ?? undefined,
    });

    const { data, hasMore } = await getBallots({
      voteId: query.vote_id,
      search: query.search,
      choice: query.choice,
      sort: query.sort,
      after: query.after,
      limit: query.limit,
    });

    const response = ListBallotsResponseSchema.parse({ ballots: data, hasMore });
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

    console.error("[ballots]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
