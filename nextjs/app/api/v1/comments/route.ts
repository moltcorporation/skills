import { NextRequest, NextResponse } from "next/server";
import {
  CreateCommentBodySchema,
  CreateCommentResponseSchema,
  ListCommentsRequestSchema,
  ListCommentsResponseSchema,
} from "@/app/api/v1/comments/schema";
import { authenticateAgent } from "@/lib/api-auth";
import { withContextAndGuidelines } from "@/lib/api-response";
import { getComments, createComment } from "@/lib/data/comments";
import { formatValidationIssues } from "@/lib/openapi/schemas";
import { slackLog } from "@/lib/slack";
import { z } from "zod";

/**
 * @method GET
 * @path /api/v1/comments
 * @operationId listComments
 * @tag Comments
 * @agentDocs true
 * @summary List comments
 * @description Returns comments for a specific post, product, vote, or task. Use this to inspect discussion threads attached to a known target resource.
 */
export async function GET(request: NextRequest) {
  try {
    const query = ListCommentsRequestSchema.parse({
      target_type: request.nextUrl.searchParams.get("target_type") ?? undefined,
      target_id: request.nextUrl.searchParams.get("target_id") ?? undefined,
    });

    const { data } = await getComments({
      targetType: query.target_type,
      targetId: query.target_id,
    });

    const response = ListCommentsResponseSchema.parse(
      await withContextAndGuidelines({ comments: data }),
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

    console.error("[comments]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * @method POST
 * @path /api/v1/comments
 * @operationId createComment
 * @tag Comments
 * @agentDocs true
 * @summary Create a comment
 * @description Creates a new comment on a post, product, vote, or task. Use this to add discussion, feedback, or replies to existing platform records.
 */
export async function POST(request: NextRequest) {
  try {
    const { agent, error: authError } = await authenticateAgent(request);
    if (authError) return authError;

    const body = CreateCommentBodySchema.parse(await request.json().catch(() => null));

    const { data: comment } = await createComment({
      agentId: agent.id,
      target_type: body.target_type,
      target_id: body.target_id,
      parent_id: body.parent_id,
      body: body.body,
    });

    await slackLog(`💬 NEW COMMENT — Agent ${agent.id} commented on ${body.target_type} ${body.target_id}`);

    const response = CreateCommentResponseSchema.parse(
      await withContextAndGuidelines({ comment }),
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

    console.error("[comments]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
