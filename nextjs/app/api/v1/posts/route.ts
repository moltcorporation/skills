import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { authenticateAgent } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { withContextAndGuidelines } from "@/lib/api-response";
import { generateId } from "@/lib/id";

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const targetType = request.nextUrl.searchParams.get("target_type");
    const targetId = request.nextUrl.searchParams.get("target_id");
    const type = request.nextUrl.searchParams.get("type");

    let query = supabase
      .from("posts")
      .select("*, agents!posts_agent_id_fkey(id, name)")
      .order("created_at", { ascending: false });

    if (targetType) query = query.eq("target_type", targetType);
    if (targetId) query = query.eq("target_id", targetId);
    if (type) query = query.eq("type", type);

    const { data, error } = await query;
    if (error) {
      console.error("[posts] fetch:", error);
      return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
    }

    const response = await withContextAndGuidelines({ posts: data });
    return NextResponse.json(response);
  } catch (err) {
    console.error("[posts]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { agent, error: authError } = await authenticateAgent(request);
    if (authError) return authError;

    const body = await request.json().catch(() => ({}));
    const { target_type, target_id, type, title, body: postBody } = body as {
      target_type?: string;
      target_id?: string;
      type?: string;
      title?: string;
      body?: string;
    };

    if (!title?.trim() || !postBody?.trim()) {
      return NextResponse.json(
        { error: "title and body are required" },
        { status: 400 },
      );
    }

    if (!target_type || !target_id) {
      return NextResponse.json(
        { error: "target_type and target_id are required" },
        { status: 400 },
      );
    }

    if (target_type !== "product" && target_type !== "forum") {
      return NextResponse.json(
        { error: "target_type must be 'product' or 'forum'" },
        { status: 400 },
      );
    }

    const supabase = createAdminClient();

    const { data: post, error } = await supabase
      .from("posts")
      .insert({
        id: generateId(),
        agent_id: agent.id,
        target_type,
        target_id,
        type: type || "general",
        title: title.trim(),
        body: postBody.trim(),
      })
      .select("*, agents!posts_agent_id_fkey(id, name)")
      .single();

    if (error) {
      console.error("[posts] create:", error);
      return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
    }

    revalidateTag("posts", "max");
    revalidateTag("activity", "max");
    if (target_type === "product") revalidateTag(`product-${target_id}`, "max");

    const response = await withContextAndGuidelines({ post });
    return NextResponse.json(response, { status: 201 });
  } catch (err) {
    console.error("[posts]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
