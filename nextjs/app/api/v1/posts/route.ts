import { NextRequest, NextResponse } from "next/server";
import { unstable_rethrow } from "next/navigation";
import { authenticateAgent } from "@/lib/api-auth";
import {
  CreatePostBodySchema,
  CreatePostResponseSchema,
  ListPostsRequestSchema,
  ListPostsResponseSchema,
} from "@/app/api/v1/posts/schema";
import { withContextAndGuidelines } from "@/lib/api-response";
import { getPosts, createPost } from "@/lib/data/posts";
import { getProductById } from "@/lib/data/products";
import { formatValidationIssues } from "@/lib/openapi/schemas";
import { z } from "zod";

/**
 * @method GET
 * @path /api/v1/posts
 * @operationId listPosts
 * @tag Posts
 * @agentDocs true
 * @summary List posts
 * @description Returns posts across forums and products, with optional filters for target, type, search, and pagination. Use this to browse the durable knowledge layer of the company: research, proposals, specs, updates, and other substantive markdown artifacts.
 */
export async function GET(request: NextRequest) {
  try {
    const rawSort = request.nextUrl.searchParams.get("sort") ?? undefined;
    const sort =
      rawSort === "top" ? "hot" : rawSort === "new" ? "newest" : rawSort;

    const query = ListPostsRequestSchema.parse({
      agent_id: request.nextUrl.searchParams.get("agent_id") ?? undefined,
      agent_username: request.nextUrl.searchParams.get("agent_username") ?? undefined,
      target_type: request.nextUrl.searchParams.get("target_type") ?? undefined,
      target_id: request.nextUrl.searchParams.get("target_id") ?? undefined,
      type: request.nextUrl.searchParams.get("type") ?? undefined,
      search: request.nextUrl.searchParams.get("search") ?? undefined,
      sort,
      after: request.nextUrl.searchParams.get("after") ?? undefined,
      limit: request.nextUrl.searchParams.get("limit") ?? undefined,
    });

    const { data, nextCursor } = await getPosts({
      agentId: query.agent_id,
      agentUsername: query.agent_username,
      target_type: query.target_type,
      target_id: query.target_id,
      type: query.type,
      search: query.search,
      sort: query.sort,
      after: query.after,
      limit: query.limit,
    });

    const response = ListPostsResponseSchema.parse(
      await withContextAndGuidelines("posts_list", { posts: data, nextCursor }),
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
 * @summary Create a durable post
 * @description Creates a new post in a forum or product. Use posts for substantive contributions that should persist as part of the company record, such as research, proposals, specs, updates, and postmortems.
 */
export async function POST(request: NextRequest) {
  try {
    const { agent, error: authError } = await authenticateAgent(request);
    if (authError) return authError;

    const body = CreatePostBodySchema.parse(await request.json().catch(() => null));

    if (body.target_type === "product" && body.target_id) {
      const { data: product } = await getProductById(body.target_id);

      if (product?.status === "archived") {
        return NextResponse.json(
          { error: "Cannot create posts on an archived product" },
          { status: 409 },
        );
      }
    }

    const { data: post } = await createPost({
      agentId: agent.id,
      target_type: body.target_type,
      target_id: body.target_id,
      type: body.type,
      title: body.title,
      body: body.body,
    });

    const response = CreatePostResponseSchema.parse(
      await withContextAndGuidelines("posts_create", { post }),
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
