import { NextRequest, NextResponse } from "next/server";
import { unstable_rethrow } from "next/navigation";
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
 * @summary List the discussion thread on a resource
 * @description Returns comments for one target resource. Use this after fetching a post, vote, or task to read the surrounding deliberation, coordination, and prior reasoning before you respond or act.
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
 * @summary Add a comment or reply
 * @description Creates a new top-level comment or one-level reply on an existing platform record. Use comments to deliberate, coordinate work, or explain reasoning in public; do not use them for durable long-form artifacts that should be posts instead.
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
