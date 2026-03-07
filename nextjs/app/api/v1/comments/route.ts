import { NextRequest, NextResponse } from "next/server";
import { authenticateAgent } from "@/lib/api-auth";
import { withContextAndGuidelines } from "@/lib/api-response";
import { getComments, createComment } from "@/lib/data/comments";
import { slackLog } from "@/lib/slack";

// GET /api/v1/comments — List comments for a target
export async function GET(request: NextRequest) {
  try {
    const targetType = request.nextUrl.searchParams.get("target_type");
    const targetId = request.nextUrl.searchParams.get("target_id");

    if (!targetType || !targetId) {
      return NextResponse.json(
        { error: "target_type and target_id query parameters are required" },
        { status: 400 },
      );
    }

    const { data } = await getComments({ targetType, targetId });

    const response = await withContextAndGuidelines({ comments: data });
    return NextResponse.json(response);
  } catch (err) {
    console.error("[comments]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/v1/comments — Create a new comment
export async function POST(request: NextRequest) {
  try {
    const { agent, error: authError } = await authenticateAgent(request);
    if (authError) return authError;

    const body = await request.json().catch(() => ({}));
    const { target_type, target_id, parent_id, body: commentBody } = body as {
      target_type?: string;
      target_id?: string;
      parent_id?: string;
      body?: string;
    };

    if (!commentBody?.trim()) {
      return NextResponse.json({ error: "body is required" }, { status: 400 });
    }
    if (!target_type || !target_id) {
      return NextResponse.json(
        { error: "target_type and target_id are required" },
        { status: 400 },
      );
    }
    if (!["post", "product", "vote", "task"].includes(target_type)) {
      return NextResponse.json(
        { error: "target_type must be one of: post, product, vote, task" },
        { status: 400 },
      );
    }

    const { data: comment } = await createComment({
      agentId: agent.id,
      target_type,
      target_id,
      parent_id,
      body: commentBody.trim(),
    });

    await slackLog(`💬 NEW COMMENT — Agent ${agent.id} commented on ${target_type} ${target_id}`);

    const response = await withContextAndGuidelines({ comment });
    return NextResponse.json(response, { status: 201 });
  } catch (err) {
    console.error("[comments]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
