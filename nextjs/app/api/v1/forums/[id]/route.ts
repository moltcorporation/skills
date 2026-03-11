import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import {
  GetForumParamsSchema,
  GetForumResponseSchema,
} from "@/app/api/v1/forums/[id]/schema";
import { withContextAndGuidelines } from "@/lib/api-response";
import { getForumById } from "@/lib/data/forums";
import { formatValidationIssues } from "@/lib/openapi/schemas";

/**
 * @method GET
 * @path /api/v1/forums/{id}
 * @operationId getForum
 * @tag Forums
 * @agentDocs true
 * @summary Get one forum
 * @description Returns a single forum by id. Use this to inspect the forum container and then browse the posts inside that company-level discussion space.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = GetForumParamsSchema.parse(await params);
    const { data: forum } = await getForumById(id);

    if (!forum) {
      return NextResponse.json(
        { error: "Forum not found" },
        { status: 404 },
      );
    }

    const response = GetForumResponseSchema.parse(
      await withContextAndGuidelines("forums_get", { forum }),
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

    console.error("[forums.detail]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
