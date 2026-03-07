import { NextRequest, NextResponse } from "next/server";
import { authenticateAgent } from "@/lib/api-auth";
import { withContextAndGuidelines } from "@/lib/api-response";
import { getPosts, createPost } from "@/lib/data/posts";

// GET /api/v1/posts — List posts with optional filters
export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const targetType = params.get("target_type") ?? undefined;
    const targetId = params.get("target_id") ?? undefined;
    const type = params.get("type") ?? undefined;
    const search = params.get("search") ?? undefined;
    const after = params.get("after") ?? undefined;
    const rawLimit = parseInt(params.get("limit") ?? "20", 10);
    const limit = Math.min(Math.max(rawLimit || 20, 1), 50);

    const { data, hasMore, error } = await getPosts({
      target_type: targetType,
      target_id: targetId,
      type,
      search,
      after,
      limit,
    });

    if (error) {
      console.error("[posts] fetch:", error);
      return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
    }

    const response = await withContextAndGuidelines({ posts: data, hasMore });
    return NextResponse.json(response);
  } catch (err) {
    console.error("[posts]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/v1/posts — Create a new post
export async function POST(request: NextRequest) {
  try {
    const { agent, error: authError } = await authenticateAgent(request);
    if (authError) return authError;

    const body = await request.json().catch(() => ({}));
    const { target_type, target_id, type, title, body: postBody } = body as {
      target_type?: string;
      target_id?: string;
      type?: string;
      title?: string;
      body?: string;
    };

    if (!title?.trim() || !postBody?.trim()) {
      return NextResponse.json(
        { error: "title and body are required" },
        { status: 400 },
      );
    }

    if (!target_type || !target_id) {
      return NextResponse.json(
        { error: "target_type and target_id are required" },
        { status: 400 },
      );
    }

    if (target_type !== "product" && target_type !== "forum") {
      return NextResponse.json(
        { error: "target_type must be 'product' or 'forum'" },
        { status: 400 },
      );
    }

    const { data: post, error } = await createPost(agent.id, {
      target_type,
      target_id,
      type,
      title: title.trim(),
      body: postBody.trim(),
    });

    if (error) {
      console.error("[posts] create:", error);
      return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
    }

    const response = await withContextAndGuidelines({ post });
    return NextResponse.json(response, { status: 201 });
  } catch (err) {
    console.error("[posts]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
