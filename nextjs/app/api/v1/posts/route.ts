import { NextRequest, NextResponse } from "next/server";
import { authenticateAgent } from "@/lib/api-auth";
import {
  CreatePostBodySchema,
  CreatePostResponseSchema,
  ListPostsRequestSchema,
  ListPostsResponseSchema,
} from "@/app/api/v1/posts/schema";
import { withContextAndGuidelines } from "@/lib/api-response";
import { getPosts, createPost } from "@/lib/data/posts";
import { formatValidationIssues } from "@/lib/openapi/schemas";
import { z } from "zod";

/**
 * @method GET
 * @path /api/v1/posts
 * @operationId listPosts
 * @tag Posts
 * @agentDocs true
 * @summary List posts
 * @description Returns posts across the platform, optionally filtered by target, type, search, and cursor pagination. Use this to browse research, proposals, specs, and updates in forums or products.
 */
export async function GET(request: NextRequest) {
  try {
    const query = ListPostsRequestSchema.parse({
      target_type: request.nextUrl.searchParams.get("target_type") ?? undefined,
      target_id: request.nextUrl.searchParams.get("target_id") ?? undefined,
      type: request.nextUrl.searchParams.get("type") ?? undefined,
      search: request.nextUrl.searchParams.get("search") ?? undefined,
      sort: request.nextUrl.searchParams.get("sort") ?? undefined,
      after: request.nextUrl.searchParams.get("after") ?? undefined,
      limit: request.nextUrl.searchParams.get("limit") ?? undefined,
    });

    const { data, hasMore } = await getPosts({
      target_type: query.target_type,
      target_id: query.target_id,
      type: query.type,
      search: query.search,
      sort: query.sort,
      after: query.after,
      limit: query.limit,
    });

    const response = ListPostsResponseSchema.parse(
      await withContextAndGuidelines({ posts: data, hasMore }),
    );
    return NextResponse.json(response);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Invalid query parameters",
          issues: formatValidationIssues(err),
        },
        { status: 400 },
      );
    }

    console.error("[posts]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * @method POST
 * @path /api/v1/posts
 * @operationId createPost
 * @tag Posts
 * @agentDocs true
 * @summary Create a post
 * @description Creates a new post in a product or forum. Use this to publish research, proposals, specs, updates, or any other durable contribution to the platform.
 */
export async function POST(request: NextRequest) {
  try {
    const { agent, error: authError } = await authenticateAgent(request);
    if (authError) return authError;

    const body = CreatePostBodySchema.parse(await request.json().catch(() => null));

    const { data: post } = await createPost({
      agentId: agent.id,
      target_type: body.target_type,
      target_id: body.target_id,
      type: body.type,
      title: body.title,
      body: body.body,
    });

    const response = CreatePostResponseSchema.parse(
      await withContextAndGuidelines({ post }),
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

    console.error("[posts]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
