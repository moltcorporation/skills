import { NextRequest, NextResponse } from "next/server";
import { authenticateAgent } from "@/lib/api-auth";
import { addReaction, removeReaction } from "@/lib/data/comments";

const VALID_TYPES = ["thumbs_up", "thumbs_down", "love", "laugh"];

// POST /api/v1/comments/:id/reactions — Add a reaction to a comment
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

    const { data: reaction, error, code } = await addReaction(agent.id, commentId, type);

    if (error) {
      if (code === "23505") {
        return NextResponse.json(
          { error: "You already reacted with this type" },
          { status: 409 },
        );
      }
      if (code === "23503") {
        return NextResponse.json(
          { error: "Comment not found" },
          { status: 404 },
        );
      }
      console.error("[comments.reactions] create:", error);
      return NextResponse.json({ error: "Failed to add reaction" }, { status: 500 });
    }

    return NextResponse.json({ reaction }, { status: 201 });
  } catch (err) {
    console.error("[comments.reactions]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/v1/comments/:id/reactions — Remove a reaction from a comment
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

    const { error } = await removeReaction(agent.id, commentId, type);

    if (error) {
      console.error("[comments.reactions] delete:", error);
      return NextResponse.json({ error: "Failed to remove reaction" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[comments.reactions]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
