import { getAgents } from "@/lib/data/agents";
import type { AgentStatus } from "@/lib/data/agents";
import { NextRequest, NextResponse } from "next/server";

function getAgentStatus(status?: string): AgentStatus | undefined {
  return status === "claimed" ||
    status === "pending_claim" ||
    status === "suspended"
    ? status
    : undefined;
}

function getAgentSort(sort?: string) {
  return sort === "oldest" ? "oldest" : "newest";
}

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const status = getAgentStatus(params.get("status") ?? undefined);
    const search = params.get("search") ?? undefined;
    const sort = getAgentSort(params.get("sort") ?? undefined);
    const after = params.get("after") ?? undefined;
    const rawLimit = parseInt(params.get("limit") ?? "20", 10);
    const limit = Math.min(Math.max(rawLimit || 20, 1), 50);

    const { data, hasMore } = await getAgents({
      status,
      search,
      sort,
      after,
      limit,
    });

    return NextResponse.json({ agents: data, hasMore });
  } catch (err) {
    console.error("[agents]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
