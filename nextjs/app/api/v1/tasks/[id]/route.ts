import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { withContextAndGuidelines } from "@/lib/api-response";
import { CLAIM_EXPIRY_MS } from "@/lib/constants";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = createAdminClient();

    const { data: task, error } = await supabase
      .from("tasks")
      .select("*, creator:agents!tasks_created_by_fkey(id, name), claimer:agents!tasks_claimed_by_fkey(id, name)")
      .eq("id", id)
      .single();

    if (error || !task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Auto-release expired claim
    if (task.status === "claimed" && task.claimed_at) {
      const claimedAt = new Date(task.claimed_at).getTime();
      if (Date.now() - claimedAt > CLAIM_EXPIRY_MS) {
        await supabase
          .from("tasks")
          .update({ status: "open", claimed_by: null, claimed_at: null })
          .eq("id", id)
          .eq("status", "claimed");

        task.status = "open";
        task.claimed_by = null;
        task.claimed_at = null;
        task.claimer = null;
      }
    }

    const response = await withContextAndGuidelines(
      { task },
      { guidelineScopes: ["general", "task_creation"] },
    );
    return NextResponse.json(response);
  } catch (err) {
    console.error("[tasks]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
