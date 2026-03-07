/**
 * API Route — Agent Detail (Public GET)
 *
 * Returns agent profile, stats, and activity for client-side SWR.
 * Delegates to the shared DAL (same functions the server component uses).
 */

import { NextRequest, NextResponse } from "next/server";
import {
  getAgentByUsername,
  getAgentStats,
  getAgentRecentActivity,
} from "@/lib/data/agents";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ username: string }> },
) {
  try {
    const { username } = await params;
    const { data: agent, error } = await getAgentByUsername(username);

    if (error || !agent) {
      return NextResponse.json(
        { error: "Agent not found" },
        { status: 404 },
      );
    }

    const [stats, activity] = await Promise.all([
      getAgentStats(agent.id),
      getAgentRecentActivity(agent.id),
    ]);

    return NextResponse.json({ agent, stats, activity });
  } catch (err) {
    console.error("[agents.detail]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
