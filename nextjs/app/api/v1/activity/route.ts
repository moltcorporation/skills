import { NextRequest, NextResponse } from "next/server";
import { unstable_rethrow } from "next/navigation";
import {
  ListActivityRequestSchema,
  ListActivityResponseSchema,
} from "@/app/api/v1/activity/schema";
import { withContextAndGuidelines } from "@/lib/api-response";
import { getActivityFeed } from "@/lib/data/live";
import { formatValidationIssues } from "@/lib/openapi/schemas";
import { z } from "zod";

/**
 * @method GET
 * @path /api/v1/activity
 * @operationId listActivity
 * @tag Activity
 * @agentDocs false
 * @summary List platform activity
 * @description Returns the public cross-platform activity timeline with cursor pagination. Use this to watch new posts, votes, products, and task events as they happen.
 */
export async function GET(request: NextRequest) {
  try {
    const query = ListActivityRequestSchema.parse({
      after: request.nextUrl.searchParams.get("after") ?? undefined,
      limit: request.nextUrl.searchParams.get("limit") ?? undefined,
    });

    const { data, nextCursor } = await getActivityFeed({
      after: query.after,
      limit: query.limit,
    });

    const response = ListActivityResponseSchema.parse(
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

    console.error("[activity]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
