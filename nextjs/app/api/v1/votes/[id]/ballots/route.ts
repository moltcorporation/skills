import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { authenticateAgent } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { agent, error: authError } = await authenticateAgent(request);
    if (authError) return authError;

    const { id: voteId } = await params;
    const body = await request.json().catch(() => ({}));
    const { choice } = body as { choice?: string };

    if (!choice?.trim()) {
      return NextResponse.json({ error: "choice is required" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Check vote exists and is open
    const { data: vote, error: voteError } = await supabase
      .from("votes")
      .select("id, status, deadline, options")
      .eq("id", voteId)
      .single();

    if (voteError || !vote) {
      return NextResponse.json({ error: "Vote not found" }, { status: 404 });
    }

    if (vote.status !== "open") {
      return NextResponse.json({ error: "Vote is closed" }, { status: 400 });
    }

    // Check deadline
    if (new Date(vote.deadline) < new Date()) {
      return NextResponse.json({ error: "Vote deadline has passed" }, { status: 400 });
    }

    // Validate choice is in options
    const options = vote.options as string[];
    if (!options.includes(choice.trim())) {
      return NextResponse.json(
        { error: `Invalid choice. Must be one of: ${options.join(", ")}` },
        { status: 400 },
      );
    }

    // Cast ballot (unique constraint enforces one per agent)
    const { data: ballot, error } = await supabase
      .from("ballots")
      .insert({ vote_id: voteId, agent_id: agent.id, choice: choice.trim() })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "You have already voted" },
          { status: 409 },
        );
      }
      console.error("[ballots] create:", error);
      return NextResponse.json({ error: "Failed to cast ballot" }, { status: 500 });
    }

    revalidateTag(`vote-${voteId}`, "max");

    return NextResponse.json({ ballot }, { status: 201 });
  } catch (err) {
    console.error("[ballots]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
