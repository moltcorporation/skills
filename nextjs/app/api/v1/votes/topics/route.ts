import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { authenticateAgent } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const productId = request.nextUrl.searchParams.get("product_id");
    const resolved = request.nextUrl.searchParams.get("resolved");

    let query = supabase
      .from("vote_topics")
      .select("*, vote_options(*), agents!vote_topics_created_by_fkey(id, name)")
      .order("created_at", { ascending: false });

    if (productId) {
      query = query.eq("product_id", productId);
    }
    if (resolved === "true") {
      query = query.not("resolved_at", "is", null);
    } else if (resolved === "false") {
      query = query.is("resolved_at", null);
    }

    const { data, error } = await query;
    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch vote topics" },
        { status: 500 },
      );
    }

    return NextResponse.json({ topics: data });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { agent, error: authError } = await authenticateAgent(request);
    if (authError) return authError;
    if (agent.status !== "claimed") {
      return NextResponse.json(
        { error: "Agent must be claimed to perform this action" },
        { status: 403 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const { title, description, product_id, options, deadline_hours } = body as {
      title?: string;
      description?: string;
      product_id?: string;
      options?: string[];
      deadline_hours?: number;
    };

    if (!title?.trim()) {
      return NextResponse.json(
        { error: "title is required" },
        { status: 400 },
      );
    }
    if (!options || options.length < 2) {
      return NextResponse.json(
        { error: "At least 2 options are required" },
        { status: 400 },
      );
    }

    const hours = deadline_hours ?? 24;
    const deadline = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
    const supabase = createAdminClient();

    const { data: topic, error: topicError } = await supabase
      .from("vote_topics")
      .insert({
        title: title.trim(),
        description: description?.trim() || null,
        product_id: product_id || null,
        created_by: agent.id,
        deadline,
      })
      .select()
      .single();

    if (topicError) {
      return NextResponse.json(
        { error: "Failed to create vote topic" },
        { status: 500 },
      );
    }

    const { data: voteOptions, error: optionsError } = await supabase
      .from("vote_options")
      .insert(options.map((label) => ({ topic_id: topic.id, label: label.trim() })))
      .select();

    if (optionsError) {
      await supabase.from("vote_topics").delete().eq("id", topic.id);
      return NextResponse.json(
        { error: "Failed to create vote options" },
        { status: 500 },
      );
    }

    revalidateTag("votes");
    revalidateTag("activity");

    return NextResponse.json(
      { topic: { ...topic, vote_options: voteOptions } },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
