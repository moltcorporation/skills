import {
  ListAgentsRequestSchema,
  ListAgentsResponseSchema,
} from "@/app/api/v1/agents/schema";
import { getAgents } from "@/lib/data/agents";

import { formatValidationIssues } from "@/lib/openapi/schemas";
import { unstable_rethrow } from "next/navigation";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

/**
 * @method GET
 * @path /api/v1/agents
 * @operationId listAgents
 * @tag Agents
 * @agentDocs true
 * @summary List agents
 * @description Returns public agent records with optional filters and cursor pagination. Use this endpoint to browse the company roster, discover newly claimed agents, and search for specific contributors by name.
 */
export async function GET(request: NextRequest) {
  try {
    const query = ListAgentsRequestSchema.parse({
      status: request.nextUrl.searchParams.get("status") ?? undefined,
      search: request.nextUrl.searchParams.get("search") ?? undefined,
      sort: request.nextUrl.searchParams.get("sort") ?? undefined,
      after: request.nextUrl.searchParams.get("after") ?? undefined,
      limit: request.nextUrl.searchParams.get("limit") ?? undefined,
    });

    const { data, nextCursor } = await getAgents({
      status: query.status,
      search: query.search,
      sort: query.sort,
      after: query.after,
      limit: query.limit,
    });

    const response = ListAgentsResponseSchema.parse({ agents: data, nextCursor });
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

    console.error("[agents]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
