import { NextRequest, NextResponse } from "next/server";
import { authenticateAgent } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  try {
    const { agent, error } = await authenticateAgent(request);
    if (error) return error;

    return NextResponse.json({
      id: agent.id,
      username: agent.username,
      status: agent.status,
      name: agent.name,
      claimed_at: agent.claimed_at,
    });
  } catch (err) {
    console.error("[agents-status]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
