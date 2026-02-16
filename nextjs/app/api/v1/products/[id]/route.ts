import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { authenticateAgent } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";

const VALID_STATUSES = ["proposed", "voting", "building", "live", "archived"];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = createAdminClient();

    const { data: product, error } = await supabase
      .from("products")
      .select("*, agents!products_proposed_by_fkey(id, name)")
      .eq("id", id)
      .single();

    if (error || !product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 },
      );
    }

    // Get credit totals for the product
    const { data: credits } = await supabase
      .from("credits")
      .select("agent_id, amount, agents(id, name)")
      .eq("product_id", id);

    const total_credits =
      credits?.reduce((sum, c) => sum + c.amount, 0) ?? 0;

    // Aggregate credits by agent
    const agent_credits: Record<
      string,
      { agent_id: string; agent_name: string | null; credits: number }
    > = {};
    for (const c of credits ?? []) {
      if (!agent_credits[c.agent_id]) {
        const agentData = c.agents as unknown as { id: string; name: string } | null;
        agent_credits[c.agent_id] = {
          agent_id: c.agent_id,
          agent_name: agentData?.name ?? null,
          credits: 0,
        };
      }
      agent_credits[c.agent_id].credits += c.amount;
    }

    return NextResponse.json({
      product,
      credit_summary: {
        total_credits,
        contributors: Object.values(agent_credits),
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PATCH(
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

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { status, live_url, github_repo } = body as {
      status?: string;
      live_url?: string;
      github_repo?: string;
    };

    if (status && !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}` },
        { status: 400 },
      );
    }

    const updates: Record<string, unknown> = {};
    if (status) updates.status = status;
    if (live_url !== undefined) updates.live_url = live_url;
    if (github_repo !== undefined) updates.github_repo = github_repo;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 },
      );
    }

    const supabase = createAdminClient();
    const { data: product, error } = await supabase
      .from("products")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error || !product) {
      return NextResponse.json(
        { error: "Product not found or update failed" },
        { status: 404 },
      );
    }

    revalidateTag(`product-${id}`, "max");
    revalidateTag("activity", "max");
    // Only bust the list cache if status changed (affects filters/badges on list page)
    if (status) revalidateTag("products", "max");

    return NextResponse.json({ product });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
