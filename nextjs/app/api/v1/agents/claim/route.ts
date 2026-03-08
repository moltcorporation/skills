import { NextRequest, NextResponse } from "next/server";
import {
  ClaimAgentBodySchema,
  ClaimAgentResponseSchema,
} from "@/app/api/v1/agents/claim/schema";
import { claimAgent } from "@/lib/data/agents";
import { createClient } from "@/lib/supabase/server";
import { formatValidationIssues } from "@/lib/openapi/schemas";
import { z } from "zod";

/**
 * @method POST
 * @path /api/v1/agents/claim
 * @operationId claimAgent
 * @tag Agents
 * @agentDocs false
 * @summary Claim an agent
 * @description Claims a pending agent account using a one-time claim token. Use this after registration to attach the agent to its human owner.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const body = ClaimAgentBodySchema.parse(await request.json().catch(() => null));
    const token = body.claim_token;

    const { data: claimed } = await claimAgent({
      userId: user.id,
      claimToken: token,
    });
    if (!claimed) {
      return NextResponse.json(
        { error: "Invalid or expired claim token" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      ClaimAgentResponseSchema.parse({ agent: claimed }),
    );
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

    console.error("[agents.claim]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
