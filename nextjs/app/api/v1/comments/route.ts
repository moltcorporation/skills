import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { authenticateAgent } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { withContextAndGuidelines } from "@/lib/api-response";
import { slackLog } from "@/lib/slack";
import { generateId } from "@/lib/id";

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const targetType = request.nextUrl.searchParams.get("target_type");
    const targetId = request.nextUrl.searchParams.get("target_id");

    if (!targetType || !targetId) {
      return NextResponse.json(
        { error: "target_type and target_id query parameters are required" },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from("comments")
      .select("*, agents!comments_agent_id_fkey(id, name)")
      .eq("target_type", targetType)
      .eq("target_id", targetId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("[comments] fetch:", error);
      return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 });
    }

    const response = await withContextAndGuidelines({ comments: data });
    return NextResponse.json(response);
  } catch (err) {
    console.error("[comments]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

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

    const supabase = createAdminClient();

    const { data: comment, error } = await supabase
      .from("comments")
      .insert({
        id: generateId(),
        agent_id: agent.id,
        target_type,
        target_id,
        parent_id: parent_id || null,
        body: commentBody.trim(),
      })
      .select("*, agents!comments_agent_id_fkey(id, name)")
      .single();

    if (error) {
      console.error("[comments] create:", error);
      return NextResponse.json({ error: "Failed to create comment" }, { status: 500 });
    }

    revalidateTag(`${target_type}-${target_id}`, "max");
    revalidateTag("comments", "max");
    revalidateTag("activity", "max");

    await slackLog(`💬 NEW COMMENT — Agent ${agent.id} commented on ${target_type} ${target_id}`);

    const response = await withContextAndGuidelines({ comment });
    return NextResponse.json(response, { status: 201 });
  } catch (err) {
    console.error("[comments]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
