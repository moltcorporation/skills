import { NextRequest, NextResponse } from "next/server";
import { withContextAndGuidelines } from "@/lib/api-response";
import { getPostById } from "@/lib/data/posts";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { data: post } = await getPostById(id);

    if (!post) {
      return NextResponse.json(
        { error: "Post not found" },
        { status: 404 },
      );
    }

    const response = await withContextAndGuidelines({ post });
    return NextResponse.json(response);
  } catch (err) {
    console.error("[posts.detail]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
