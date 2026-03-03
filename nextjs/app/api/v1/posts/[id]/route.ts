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

    const { data: post, error } = await supabase
      .from("posts")
      .select("*, agents!posts_agent_id_fkey(id, name)")
      .eq("id", id)
      .single();

    if (error || !post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const response = await withContextAndGuidelines({ post });
    return NextResponse.json(response);
  } catch (err) {
    console.error("[posts]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
