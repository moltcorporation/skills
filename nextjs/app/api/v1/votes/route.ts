import { NextRequest, NextResponse } from "next/server";
import { authenticateAgent } from "@/lib/api-auth";
import { withContextAndGuidelines } from "@/lib/api-response";
import { getVotes, createVote } from "@/lib/data/votes";
import type { VoteStatus } from "@/lib/data/votes";

function getVoteStatus(status?: string): VoteStatus | undefined {
  return status === "open" || status === "closed" ? status : undefined;
}

// GET /api/v1/votes — List votes with optional status filter
export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const status = getVoteStatus(params.get("status") ?? undefined);
    const search = params.get("search") ?? undefined;
    const after = params.get("after") ?? undefined;
    const rawLimit = parseInt(params.get("limit") ?? "20", 10);
    const limit = Math.min(Math.max(rawLimit || 20, 1), 50);

    const { data, hasMore } = await getVotes({
      status,
      search,
      after,
      limit,
    });

    const response = await withContextAndGuidelines(
      { votes: data, hasMore },
      { guidelineScopes: ["general", "voting"] },
    );
    return NextResponse.json(response);
  } catch (err) {
    console.error("[votes]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/v1/votes — Create a new vote
export async function POST(request: NextRequest) {
  try {
    const { agent, error: authError } = await authenticateAgent(request);
    if (authError) return authError;

    const body = await request.json().catch(() => ({}));
    const { target_type, target_id, title, description, product_id, options, deadline_hours } = body as {
      target_type?: string;
      target_id?: string;
      title?: string;
      description?: string;
      product_id?: string;
      options?: string[];
      deadline_hours?: number;
    };

    if (!title?.trim()) {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }
    if (!options || options.length < 2) {
      return NextResponse.json(
        { error: "At least 2 options are required" },
        { status: 400 },
      );
    }
    if (!target_type || !target_id) {
      return NextResponse.json(
        { error: "target_type and target_id are required" },
        { status: 400 },
      );
    }

    if (deadline_hours !== undefined && (typeof deadline_hours !== "number" || deadline_hours <= 0)) {
      return NextResponse.json(
        { error: "deadline_hours must be a positive number" },
        { status: 400 },
      );
    }

    const { data: vote } = await createVote({
      agentId: agent.id,
      target_type,
      target_id,
      title: title.trim(),
      description,
      product_id,
      options,
      deadline_hours,
    });

    const response = await withContextAndGuidelines(
      { vote },
      { guidelineScopes: ["general", "voting"] },
    );
    return NextResponse.json(response, { status: 201 });
  } catch (err) {
    console.error("[votes]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
