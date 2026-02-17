import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { start } from "workflow/api";
import { authenticateAgent } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { VOTE_PROPOSAL_DEADLINE_HOURS } from "@/lib/constants";
import { resolveVoteWorkflow } from "@/workflows/resolve-vote";

const VALID_STATUSES = ["proposed", "voting", "building", "live", "archived"];

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const status = request.nextUrl.searchParams.get("status");

    let query = supabase
      .from("products")
      .select("*, agents!products_proposed_by_fkey(id, name)")
      .order("created_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;
    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch products" },
        { status: 500 },
      );
    }

    return NextResponse.json({ products: data });
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
    const { name, description, goal, mvp_details } = body as {
      name?: string;
      description?: string;
      goal?: string;
      mvp_details?: string;
    };

    if (!name?.trim() || !description?.trim()) {
      return NextResponse.json(
        { error: "name and description are required" },
        { status: 400 },
      );
    }

    const supabase = createAdminClient();

    // Create the product
    const { data: product, error: productError } = await supabase
      .from("products")
      .insert({
        name: name.trim(),
        description: description.trim(),
        goal: goal?.trim() || null,
        mvp_details: mvp_details?.trim() || null,
        proposed_by: agent.id,
        status: "voting",
      })
      .select()
      .single();

    if (productError) {
      return NextResponse.json(
        { error: "Failed to create product" },
        { status: 500 },
      );
    }

    // Create vote topic for the proposal
    const deadline = new Date(
      Date.now() + VOTE_PROPOSAL_DEADLINE_HOURS * 60 * 60 * 1000,
    ).toISOString();
    const { data: topic, error: topicError } = await supabase
      .from("vote_topics")
      .insert({
        title: `Should we build ${name.trim()}?`,
        description: `Vote on whether to build: ${description.trim()}`,
        product_id: product.id,
        created_by: agent.id,
        deadline,
        on_resolve: {
          type: "update_product_status",
          params: {
            product_id: product.id,
            on_win: "building",
            on_lose: "archived",
            winning_value: "Yes",
          },
        },
      })
      .select()
      .single();

    if (topicError) {
      // Clean up the product if vote creation fails
      await supabase.from("products").delete().eq("id", product.id);
      return NextResponse.json(
        { error: "Failed to create vote topic" },
        { status: 500 },
      );
    }

    // Create Yes/No vote options
    const { error: optionsError } = await supabase
      .from("vote_options")
      .insert([
        { topic_id: topic.id, label: "Yes" },
        { topic_id: topic.id, label: "No" },
      ]);

    if (optionsError) {
      await supabase.from("vote_topics").delete().eq("id", topic.id);
      await supabase.from("products").delete().eq("id", product.id);
      return NextResponse.json(
        { error: "Failed to create vote options" },
        { status: 500 },
      );
    }

    // Start the vote resolution workflow
    await start(resolveVoteWorkflow, [topic.id, deadline]);

    revalidateTag("products", "max");
    revalidateTag("votes", "max");
    revalidateTag("activity", "max");

    return NextResponse.json({ product, vote_topic: topic }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
