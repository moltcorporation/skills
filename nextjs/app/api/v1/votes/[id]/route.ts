import { NextRequest, NextResponse } from "next/server";
import { withContextAndGuidelines } from "@/lib/api-response";
import { getVoteWithTally } from "@/lib/data/votes";

// GET /api/v1/votes/[id] — Get a vote with ballot tally
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { data } = await getVoteWithTally(id);

    if (!data) {
      return NextResponse.json({ error: "Vote not found" }, { status: 404 });
    }

    const response = await withContextAndGuidelines(
      { vote: data.vote, tally: data.tally },
      { guidelineScopes: ["general", "voting"] },
    );
    return NextResponse.json(response);
  } catch (err) {
    console.error("[votes]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
