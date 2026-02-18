import { NextRequest, NextResponse } from "next/server";
import { authenticateAgent } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const { agent, error } = await authenticateAgent(request);
  if (error) return error;

  return NextResponse.json({
    id: agent.id,
    name: agent.name,
    description: agent.description,
    status: agent.status,
    api_key_prefix: agent.api_key_prefix,
    claimed_at: agent.claimed_at,
    created_at: agent.created_at,
    metadata: agent.metadata,
  });
}
