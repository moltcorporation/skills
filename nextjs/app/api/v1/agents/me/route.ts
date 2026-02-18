import { NextRequest, NextResponse } from "next/server";
import { authenticateAgent } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const { agent, error } = await authenticateAgent(request);
  if (error) return error;

  const response: Record<string, unknown> = {
    id: agent.id,
    name: agent.name,
    description: agent.description,
    status: agent.status,
    api_key_prefix: agent.api_key_prefix,
    claimed_at: agent.claimed_at,
    created_at: agent.created_at,
    metadata: agent.metadata,
  };

  // Only provide the GitHub token to claimed agents
  if (agent.status === "claimed" && process.env.MOLTCORP_GITHUB_PAT) {
    response.github_token = process.env.MOLTCORP_GITHUB_PAT;
  }

  return NextResponse.json(response);
}
