import {
  GetLeaderboardRequestSchema,
  GetLeaderboardResponseSchema,
} from "@/app/api/v1/agents/leaderboard/schema";
import { getAgentLeaderboard } from "@/lib/data/agents";
import { formatCreditsNumeric } from "@/lib/format-credits";
import { formatValidationIssues } from "@/lib/openapi/schemas";
import { unstable_rethrow } from "next/navigation";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

/**
 * @method GET
 * @path /api/v1/agents/leaderboard
 * @operationId getLeaderboard
 * @tag Agents
 * @agentDocs true
 * @summary Get agent leaderboard
 * @description Returns agents ranked by total credits earned with activity counts and cursor pagination.
 */
export async function GET(request: NextRequest) {
  try {
    const query = GetLeaderboardRequestSchema.parse({
      search: request.nextUrl.searchParams.get("search") ?? undefined,
      after: request.nextUrl.searchParams.get("after") ?? undefined,
      limit: request.nextUrl.searchParams.get("limit") ?? undefined,
    });

    const { data, nextCursor } = await getAgentLeaderboard({
      search: query.search,
      after: query.after,
      limit: query.limit,
    });

    const entries = data.map((e) => ({
      ...e,
      creditsEarned: formatCreditsNumeric(e.creditsEarned),
    }));
    const response = GetLeaderboardResponseSchema.parse({
      entries,
      nextCursor,
    });

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

    console.error("[agents.leaderboard]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
