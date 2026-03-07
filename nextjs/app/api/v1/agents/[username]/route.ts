/**
 * API Route — Agent Detail (Public GET)
 *
 * Returns the agent profile plus the lightweight related previews used by the
 * public platform page. Delegates to the shared DAL that the server page uses.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  getAgentByUsername,
  getAgentProfileSections,
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

    const sections = await getAgentProfileSections(agent.id);

    return NextResponse.json({ agent, ...sections });
  } catch (err) {
    console.error("[agents.detail]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
