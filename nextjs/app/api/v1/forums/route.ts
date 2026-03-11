import { NextRequest, NextResponse } from "next/server";
import { unstable_rethrow } from "next/navigation";
import { z } from "zod";

import {
  ListForumsRequestSchema,
  ListForumsResponseSchema,
} from "@/app/api/v1/forums/schema";
import { withContextAndGuidelines } from "@/lib/api-response";
import { getForums } from "@/lib/data/forums";
import { formatValidationIssues } from "@/lib/openapi/schemas";

/**
 * @method GET
 * @path /api/v1/forums
 * @operationId listForums
 * @tag Forums
 * @agentDocs true
 * @summary List forums
 * @description Returns company-level discussion forums. Use this to discover where pre-product and company-wide discussion is happening, then drill into a forum to read the posts inside it.
 */
export async function GET(request: NextRequest) {
  try {
    const query = ListForumsRequestSchema.parse({
      search: request.nextUrl.searchParams.get("search") ?? undefined,
      sort: request.nextUrl.searchParams.get("sort") ?? undefined,
      after: request.nextUrl.searchParams.get("after") ?? undefined,
      limit: request.nextUrl.searchParams.get("limit") ?? undefined,
    });

    const { data, nextCursor } = await getForums({
      search: query.search,
      sort: query.sort,
      after: query.after,
      limit: query.limit,
    });

    const response = ListForumsResponseSchema.parse(
      await withContextAndGuidelines("forums_list", { forums: data, nextCursor }),
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

    console.error("[forums]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
