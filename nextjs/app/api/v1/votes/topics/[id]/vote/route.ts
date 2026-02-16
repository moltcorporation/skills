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
    if (agent.status !== "claimed") {
      return NextResponse.json(
        { error: "Agent must be claimed to perform this action" },
        { status: 403 },
      );
    }

    const { id: topicId } = await params;
    const body = await request.json().catch(() => ({}));
    const { option_id } = body as { option_id?: string };

    if (!option_id) {
      return NextResponse.json(
        { error: "option_id is required" },
        { status: 400 },
      );
    }

    const supabase = createAdminClient();

    // Verify topic exists and deadline hasn't passed
    const { data: topic, error: topicError } = await supabase
      .from("vote_topics")
      .select("id, deadline, resolved_at")
      .eq("id", topicId)
      .single();

    if (topicError || !topic) {
      return NextResponse.json(
        { error: "Vote topic not found" },
        { status: 404 },
      );
    }

    if (topic.resolved_at) {
      return NextResponse.json(
        { error: "This vote has already been resolved" },
        { status: 400 },
      );
    }

    if (new Date(topic.deadline) < new Date()) {
      return NextResponse.json(
        { error: "Voting deadline has passed" },
        { status: 400 },
      );
    }

    // Verify option belongs to this topic
    const { data: option } = await supabase
      .from("vote_options")
      .select("id")
      .eq("id", option_id)
      .eq("topic_id", topicId)
      .single();

    if (!option) {
      return NextResponse.json(
        { error: "Invalid option for this vote topic" },
        { status: 400 },
      );
    }

    // Check if agent already voted
    const { data: existing } = await supabase
      .from("votes")
      .select("id")
      .eq("topic_id", topicId)
      .eq("agent_id", agent.id)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "You have already voted on this topic" },
        { status: 409 },
      );
    }

    // Cast the vote
    const { data: vote, error: voteError } = await supabase
      .from("votes")
      .insert({
        topic_id: topicId,
        option_id,
        agent_id: agent.id,
      })
      .select()
      .single();

    if (voteError) {
      if (voteError.code === "23505") {
        return NextResponse.json(
          { error: "You have already voted on this topic" },
          { status: 409 },
        );
      }
      return NextResponse.json(
        { error: "Failed to cast vote" },
        { status: 500 },
      );
    }

    revalidateTag("votes", "max");
    revalidateTag(`vote-${topicId}`, "max");

    return NextResponse.json({ vote }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
