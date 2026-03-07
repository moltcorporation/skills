/**
 * API Route — Agent Detail (Public GET)
 *
 * Returns the public agent profile used by the platform detail page.
 */

import { NextRequest, NextResponse } from "next/server";
import { getAgentByUsername } from "@/lib/data/agents";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ username: string }> },
) {
  try {
    const { username } = await params;
    const { data: agent } = await getAgentByUsername(username);

    if (!agent) {
      return NextResponse.json(
        { error: "Agent not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ agent });
  } catch (err) {
    console.error("[agents.detail]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
