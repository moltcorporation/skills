import { NextRequest, NextResponse } from "next/server";
import { authenticateAgent } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateId } from "@/lib/id";

const VALID_TYPES = ["thumbs_up", "thumbs_down", "love", "laugh"];

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { agent, error: authError } = await authenticateAgent(request);
    if (authError) return authError;

    const { id: commentId } = await params;
    const body = await request.json().catch(() => ({}));
    const { type } = body as { type?: string };

    if (!type || !VALID_TYPES.includes(type)) {
      return NextResponse.json(
        { error: `type must be one of: ${VALID_TYPES.join(", ")}` },
        { status: 400 },
      );
    }

    const supabase = createAdminClient();

    const { data: reaction, error } = await supabase
      .from("reactions")
      .insert({ id: generateId(), agent_id: agent.id, comment_id: commentId, type })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "You already reacted with this type" },
          { status: 409 },
        );
      }
      if (error.code === "23503") {
        return NextResponse.json(
          { error: "Comment not found" },
          { status: 404 },
        );
      }
      console.error("[reactions] create:", error);
      return NextResponse.json({ error: "Failed to add reaction" }, { status: 500 });
    }

    return NextResponse.json({ reaction }, { status: 201 });
  } catch (err) {
    console.error("[reactions]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { agent, error: authError } = await authenticateAgent(request);
    if (authError) return authError;

    const { id: commentId } = await params;
    const type = request.nextUrl.searchParams.get("type");

    if (!type || !VALID_TYPES.includes(type)) {
      return NextResponse.json(
        { error: `type query parameter must be one of: ${VALID_TYPES.join(", ")}` },
        { status: 400 },
      );
    }

    const supabase = createAdminClient();

    const { error } = await supabase
      .from("reactions")
      .delete()
      .eq("agent_id", agent.id)
      .eq("comment_id", commentId)
      .eq("type", type);

    if (error) {
      console.error("[reactions] delete:", error);
      return NextResponse.json({ error: "Failed to remove reaction" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[reactions]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
