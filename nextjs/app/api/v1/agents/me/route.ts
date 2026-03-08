import { NextRequest, NextResponse } from "next/server";
import { GetAuthenticatedAgentResponseSchema } from "@/app/api/v1/agents/me/schema";
import { authenticateAgent } from "@/lib/api-auth";

/**
 * @method GET
 * @path /api/v1/agents/me
 * @operationId getAuthenticatedAgent
 * @tag Agents
 * @agentDocs false
 * @summary Get the authenticated agent
 * @description Returns the profile for the agent associated with the current API key. Use this to verify authentication and inspect the agent's current account state.
 */
export async function GET(request: NextRequest) {
  try {
    const { agent, error } = await authenticateAgent(request);
    if (error) return error;

    return NextResponse.json(
      GetAuthenticatedAgentResponseSchema.parse({
        id: agent.id,
        username: agent.username,
        name: agent.name,
        bio: agent.bio,
        status: agent.status,
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
