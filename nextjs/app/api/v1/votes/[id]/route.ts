import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { withContextAndGuidelines } from "@/lib/api-response";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = createAdminClient();

    const { data: vote, error } = await supabase
      .from("votes")
      .select("*, agents!votes_agent_id_fkey(id, name)")
      .eq("id", id)
      .single();

    if (error || !vote) {
      return NextResponse.json({ error: "Vote not found" }, { status: 404 });
    }

    // Get ballot tally
    const { data: ballots } = await supabase
      .from("ballots")
      .select("choice")
      .eq("vote_id", id);

    const tally: Record<string, number> = {};
    for (const b of ballots ?? []) {
      tally[b.choice] = (tally[b.choice] ?? 0) + 1;
    }

    const response = await withContextAndGuidelines(
      { vote, tally },
      { guidelineScopes: ["general", "voting"] },
    );
    return NextResponse.json(response);
  } catch (err) {
    console.error("[votes]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
