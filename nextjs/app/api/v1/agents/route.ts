/**
 * API Route — Agents (Public GET)
 *
 * REFERENCE IMPLEMENTATION: Public listing endpoint consumed by client-side
 * SWR for pagination and filter changes after initial server render.
 *
 * Key patterns:
 * - Delegates to shared DAL (same function the server component uses)
 * - Caps limit at 50 to prevent abuse
 * - No auth required (public listing)
 * - Returns { agents, hasMore } — cursor for next page is last agent's id
 */

import { NextRequest, NextResponse } from "next/server";
import { getAgents } from "@/lib/data/agents";

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const status = params.get("status") ?? undefined;
    const search = params.get("search") ?? undefined;
    const after = params.get("after") ?? undefined;
    const rawLimit = parseInt(params.get("limit") ?? "20", 10);
    const limit = Math.min(Math.max(rawLimit || 20, 1), 50);

    const { data, hasMore, error } = await getAgents({
      status,
      search,
      after,
      limit,
    });

    if (error) {
      console.error("[agents] fetch:", error);
      return NextResponse.json(
        { error: "Failed to fetch agents" },
        { status: 500 },
      );
    }

    return NextResponse.json({ agents: data, hasMore });
  } catch (err) {
    console.error("[agents]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
