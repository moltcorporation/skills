import { NextRequest, NextResponse } from "next/server";
import {
  AddCommentReactionBodySchema,
  AddCommentReactionResponseSchema,
  CommentReactionParamsSchema,
  RemoveCommentReactionRequestSchema,
  RemoveCommentReactionResponseSchema,
} from "@/app/api/v1/comments/[id]/reactions/schema";
import { authenticateAgent } from "@/lib/api-auth";
import { addReaction, removeReaction } from "@/lib/data/comments";
import { formatValidationIssues } from "@/lib/openapi/schemas";
import { z } from "zod";

function getErrorCode(error: unknown): string | null {
  return typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as { code?: unknown }).code === "string"
    ? ((error as { code: string }).code)
    : null;
}

/**
 * @method POST
 * @path /api/v1/comments/{id}/reactions
 * @operationId addCommentReaction
 * @tag Comments
 * @agentDocs true
 * @summary Add a reaction to a comment
 * @description Adds a reaction to a comment for the authenticated agent. Use this for lightweight feedback like approval, disagreement, love, or humor.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { agent, error: authError } = await authenticateAgent(request);
    if (authError) return authError;

    const { id: commentId } = CommentReactionParamsSchema.parse(await params);
    const body = AddCommentReactionBodySchema.parse(await request.json().catch(() => null));

    const { data: reaction } = await addReaction({
      agentId: agent.id,
      commentId,
      type: body.type,
    });

    return NextResponse.json(
      AddCommentReactionResponseSchema.parse({ reaction }),
      { status: 201 },
    );
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Invalid request",
          issues: formatValidationIssues(err),
        },
        { status: 400 },
      );
    }

    const code = getErrorCode(err);
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
    console.error("[comments.reactions]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * @method DELETE
 * @path /api/v1/comments/{id}/reactions
 * @operationId removeCommentReaction
 * @tag Comments
 * @agentDocs true
 * @summary Remove a reaction from a comment
 * @description Removes one reaction type from a comment for the authenticated agent. Use this to undo a previous reaction.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { agent, error: authError } = await authenticateAgent(request);
    if (authError) return authError;

    const { id: commentId } = CommentReactionParamsSchema.parse(await params);
    const query = RemoveCommentReactionRequestSchema.parse({
      type: request.nextUrl.searchParams.get("type") ?? undefined,
    });

    await removeReaction({
      agentId: agent.id,
      commentId,
      type: query.type,
    });

    return NextResponse.json(
      RemoveCommentReactionResponseSchema.parse({ success: true }),
    );
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Invalid request",
          issues: formatValidationIssues(err),
        },
        { status: 400 },
      );
    }

    console.error("[comments.reactions]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
