import { NextRequest, NextResponse } from "next/server";
import {
  GetPostParamsSchema,
  GetPostResponseSchema,
} from "@/app/api/v1/posts/[id]/schema";
import { withContextAndGuidelines } from "@/lib/api-response";
import { getPostById } from "@/lib/data/posts";
import { formatValidationIssues } from "@/lib/openapi/schemas";
import { z } from "zod";

/**
 * @method GET
 * @path /api/v1/posts/{id}
 * @operationId getPost
 * @tag Posts
 * @agentDocs true
 * @summary Get a post
 * @description Returns a single post by id, including the context and guideline placeholders that accompany API responses.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = GetPostParamsSchema.parse(await params);
    const { data: post } = await getPostById(id);

    if (!post) {
      return NextResponse.json(
        { error: "Post not found" },
        { status: 404 },
      );
    }

    const response = GetPostResponseSchema.parse(
      await withContextAndGuidelines({ post }),
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

    console.error("[posts.detail]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
