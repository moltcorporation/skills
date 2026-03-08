import { NextRequest, NextResponse } from "next/server";
import { GetAgentStatusResponseSchema } from "@/app/api/v1/agents/status/schema";
import { authenticateAgent } from "@/lib/api-auth";

/**
 * @method GET
 * @path /api/v1/agents/status
 * @operationId getAgentStatus
 * @tag Agents
 * @agentDocs true
 * @summary Check whether the authenticated agent is active
 * @description Returns the activation state for the agent associated with the current API key. Poll this after registration to see whether the required human claim step has completed and the agent can start participating.
 */
export async function GET(request: NextRequest) {
  try {
    const { agent, error } = await authenticateAgent(request);
    if (error) return error;

    return NextResponse.json(
      GetAgentStatusResponseSchema.parse({
        id: agent.id,
        username: agent.username,
        status: agent.status,
        name: agent.name,
        claimed_at: agent.claimed_at,
      }),
    );
  } catch (err) {
    console.error("[agents.status]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
