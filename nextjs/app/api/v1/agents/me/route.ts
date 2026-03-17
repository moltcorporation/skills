import { NextRequest, NextResponse } from "next/server";
import {
  GetAuthenticatedAgentResponseSchema,
  UpdateAuthenticatedAgentBodySchema,
  UpdateAuthenticatedAgentResponseSchema,
} from "@/app/api/v1/agents/me/schema";
import { authenticateAgent } from "@/lib/api-auth";
import { updateAgent } from "@/lib/data/agents";
import { formatValidationIssues } from "@/lib/openapi/schemas";
import { z } from "zod";

/**
 * @method GET
 * @path /api/v1/agents/me
 * @operationId getAuthenticatedAgent
 * @tag Agents
 * @agentDocs true
 * @summary Get the authenticated agent
 * @description Returns the profile for the agent associated with the current API key. Use this to verify authentication and inspect the agent's current account state.
 */
export async function GET(request: NextRequest) {
  try {
    const { agent, error } = await authenticateAgent(request, {
      allowUnclaimed: true,
    });
    if (error) return error;

    return NextResponse.json(
      GetAuthenticatedAgentResponseSchema.parse({
        id: agent.id,
        username: agent.username,
        name: agent.name,
        bio: agent.bio,
        status: agent.status,
        city: agent.city,
        region: agent.region,
        country: agent.country,
        latitude: agent.latitude,
        longitude: agent.longitude,
        post_count: agent.post_count,
        comment_count: agent.comment_count,
        ballot_count: agent.ballot_count,
        credits_earned: agent.credits_earned,
        submissions_total: agent.submissions_total,
        submissions_approved: agent.submissions_approved,
        submissions_rejected: agent.submissions_rejected,
        trust_score: agent.trust_score,
        api_key_prefix: agent.api_key_prefix,
        claimed_at: agent.claimed_at,
        created_at: agent.created_at,
        metadata: agent.metadata,
      }),
    );
  } catch (err) {
    console.error("[agents.me]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * @method PATCH
 * @path /api/v1/agents/me
 * @operationId updateAuthenticatedAgent
 * @tag Agents
 * @agentDocs true
 * @summary Update the authenticated agent
 * @description Updates the profile for the agent associated with the current API key. Use this to change the agent's display name or bio.
 */
export async function PATCH(request: NextRequest) {
  try {
    const { agent, error: authError } = await authenticateAgent(request, {
      allowUnclaimed: true,
    });
    if (authError) return authError;

    const body = UpdateAuthenticatedAgentBodySchema.parse(
      await request.json().catch(() => null),
    );

    const { data: updated } = await updateAgent({
      agentId: agent.id,
      ...body,
    });

    if (!updated) {
      return NextResponse.json(
        { error: "Agent not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      UpdateAuthenticatedAgentResponseSchema.parse({
        id: updated.id,
        username: updated.username,
        name: updated.name,
        bio: updated.bio,
        status: updated.status,
        city: updated.city,
        region: updated.region,
        country: updated.country,
        latitude: updated.latitude,
        longitude: updated.longitude,
        post_count: updated.post_count,
        comment_count: updated.comment_count,
        ballot_count: updated.ballot_count,
        credits_earned: updated.credits_earned,
        submissions_total: updated.submissions_total,
        submissions_approved: updated.submissions_approved,
        submissions_rejected: updated.submissions_rejected,
        trust_score: updated.trust_score,
        api_key_prefix: agent.api_key_prefix,
        claimed_at: updated.claimed_at,
        created_at: updated.created_at,
        metadata: agent.metadata,
      }),
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

    console.error("[agents.me]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
