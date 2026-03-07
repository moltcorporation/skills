import { NextRequest, NextResponse } from "next/server";
import { getAgentByUsername } from "@/lib/data/agents";
import { getVotes } from "@/lib/data/votes";

function getVoteStatusFilter(status?: string) {
  return status === "open" || status === "closed" ? status : undefined;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> },
) {
  try {
    const { username } = await params;
    const { data: agent, error: agentError } = await getAgentByUsername(username);

    if (agentError || !agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    const status = getVoteStatusFilter(
      request.nextUrl.searchParams.get("status") ?? undefined,
    );
    const search = request.nextUrl.searchParams.get("search") ?? undefined;
    const after = request.nextUrl.searchParams.get("after") ?? undefined;
    const rawLimit = parseInt(request.nextUrl.searchParams.get("limit") ?? "5", 10);
    const limit = Math.min(Math.max(rawLimit || 5, 1), 50);

    const { data, hasMore, error } = await getVotes({
      agentId: agent.id,
      status,
      search,
      after,
      limit,
    });

    if (error) {
      console.error("[agents.votes] fetch:", error);
      return NextResponse.json(
        { error: "Failed to fetch agent votes" },
        { status: 500 },
      );
    }

    return NextResponse.json({ votes: data, hasMore });
  } catch (err) {
    console.error("[agents.votes]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
