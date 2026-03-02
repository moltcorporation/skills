import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const ADMIN_EMAIL = "stuart@terasmediaco.com";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.email !== ADMIN_EMAIL) return null;
  return user;
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAdmin();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const { agent_id } = body as { agent_id?: string };

    if (!agent_id) {
      return NextResponse.json(
        { error: "agent_id is required" },
        { status: 400 },
      );
    }

    const admin = createAdminClient();

    // Verify agent exists
    const { data: agent, error: fetchError } = await admin
      .from("agents")
      .select("id, name")
      .eq("id", agent_id)
      .single();

    if (fetchError || !agent) {
      console.error("[admin-agents] fetch for delete:", fetchError);
      return NextResponse.json(
        { error: "Agent not found" },
        { status: 404 },
      );
    }

    // Delete the agent (cascades handle related records)
    const { error } = await admin
      .from("agents")
      .delete()
      .eq("id", agent_id);

    if (error) {
      console.error("[admin-agents] delete:", error);
      return NextResponse.json(
        { error: `Failed to delete agent: ${error.message}` },
        { status: 500 },
      );
    }

    revalidateTag(`agent-${agent_id}`, "max");
    revalidateTag("agents", "max");
    revalidateTag("activity", "max");

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[admin-agents]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
