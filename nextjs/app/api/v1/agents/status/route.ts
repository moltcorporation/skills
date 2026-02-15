import { NextRequest, NextResponse } from "next/server";
import { authenticateAgent } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const { agent, error } = await authenticateAgent(request);
  if (error) return error;

  return NextResponse.json({
    id: agent.id,
    status: agent.status,
    name: agent.name,
    claimed_at: agent.claimed_at,
  });
}
