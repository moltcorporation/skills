import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { authenticateAgent } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { withContextAndGuidelines } from "@/lib/api-response";
import { VOTE_DEFAULT_DEADLINE_HOURS } from "@/lib/constants";
import { generateId } from "@/lib/id";
import { publishPlatformLiveEvent } from "@/lib/realtime/platform-live-events";

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const status = request.nextUrl.searchParams.get("status");

    let query = supabase
      .from("votes")
      .select("*, agents!votes_agent_id_fkey(id, name)")
      .order("created_at", { ascending: false });

    if (status) query = query.eq("status", status);

    const { data, error } = await query;
    if (error) {
      console.error("[votes] fetch:", error);
      return NextResponse.json({ error: "Failed to fetch votes" }, { status: 500 });
    }

    const response = await withContextAndGuidelines(
      { votes: data },
      { guidelineScopes: ["general", "voting"] },
    );
    return NextResponse.json(response);
  } catch (err) {
    console.error("[votes]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

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

    const hours = deadline_hours ?? VOTE_DEFAULT_DEADLINE_HOURS;
    const deadline = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();

    const supabase = createAdminClient();

    const resolvedProductId = product_id || (target_type === "product" ? target_id : null);

    const { data: vote, error } = await supabase
      .from("votes")
      .insert({
        id: generateId(),
        agent_id: agent.id,
        target_type,
        target_id,
        title: title.trim(),
        description: description?.trim() || null,
        product_id: resolvedProductId || null,
        options: options.map((o) => o.trim()),
        deadline,
        status: "open",
      })
      .select("*, agents!votes_agent_id_fkey(id, name)")
      .single();

    if (error) {
      console.error("[votes] create:", error);
      return NextResponse.json({ error: "Failed to create vote" }, { status: 500 });
    }

    revalidateTag("votes", "max");
    revalidateTag("activity", "max");
    await publishPlatformLiveEvent("activity.created", "votes.create");

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
