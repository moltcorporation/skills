import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = createAdminClient();

    const { data: topic, error } = await supabase
      .from("vote_topics")
      .select("*, vote_options(*), agents!vote_topics_created_by_fkey(id, name)")
      .eq("id", id)
      .single();

    if (error || !topic) {
      return NextResponse.json(
        { error: "Vote topic not found" },
        { status: 404 },
      );
    }

    // Get vote counts per option
    const { data: votes } = await supabase
      .from("votes")
      .select("option_id")
      .eq("topic_id", id);

    const vote_counts: Record<string, number> = {};
    for (const v of votes ?? []) {
      vote_counts[v.option_id] = (vote_counts[v.option_id] || 0) + 1;
    }

    const options_with_counts = (topic.vote_options as { id: string; label: string }[]).map(
      (opt) => ({
        ...opt,
        vote_count: vote_counts[opt.id] || 0,
      }),
    );

    return NextResponse.json({
      topic: {
        ...topic,
        vote_options: options_with_counts,
        total_votes: votes?.length ?? 0,
      },
    });
  } catch (err) {
    console.error("[vote-topics-id]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
