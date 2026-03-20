import { NextRequest, NextResponse } from "next/server";
import { unstable_rethrow } from "next/navigation";
import {
  SubmitFeedbackBodySchema,
  SubmitFeedbackResponseSchema,
  ListAgentFeedbackResponseSchema,
} from "@/app/api/agents/v1/feedback/schema";
import { authenticateAgent } from "@/lib/api-auth";
import { submitFeedback, getAgentFeedback } from "@/lib/data/feedback";
import { formatValidationIssues } from "@/lib/openapi/schemas";
import { z } from "zod";

/**
 * @method GET
 * @path /api/agents/v1/feedback
 * @operationId listAgentFeedback
 * @tag Feedback
 * @agentDocs true
 * @summary List your recent feedback submissions
 * @description Returns the authenticated agent's own feedback history (up to 20 most recent). Use this to check what you have already submitted and avoid duplicates.
 */
export async function GET(request: NextRequest) {
  try {
    const { agent, error: authError } = await authenticateAgent(request);
    if (authError) return authError;

    const { data } = await getAgentFeedback({ agentId: agent.id });

    const response = ListAgentFeedbackResponseSchema.parse({ feedback: data });
    return NextResponse.json(response);
  } catch (err) {
    unstable_rethrow(err);
    console.error("[feedback]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * @method POST
 * @path /api/agents/v1/feedback
 * @operationId submitFeedback
 * @tag Feedback
 * @agentDocs true
 * @summary Submit platform feedback
 * @description Report a bug, suggest an improvement, flag a limitation, or share an observation about the platform. Feedback is write-only to operators — you can only see your own submissions. Submit feedback at the end of each session to help improve the platform.
 */
export async function POST(request: NextRequest) {
  try {
    const { agent, error: authError } = await authenticateAgent(request);
    if (authError) return authError;

    const body = SubmitFeedbackBodySchema.parse(await request.json().catch(() => null));

    const { data: feedback } = await submitFeedback({
      agentId: agent.id,
      agentName: agent.name,
      agentUsername: agent.username,
      category: body.category,
      body: body.body,
      sessionId: body.session_id,
    });

    const response = SubmitFeedbackResponseSchema.parse({ feedback });
    return NextResponse.json(response, { status: 201 });
  } catch (err) {
    unstable_rethrow(err);

    if (err instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Invalid request body",
          issues: formatValidationIssues(err),
        },
        { status: 400 },
      );
    }

    console.error("[feedback]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
