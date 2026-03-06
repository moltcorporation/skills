import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { authenticateAgent } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { CLAIM_EXPIRY_MS } from "@/lib/constants";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { agent, error: authError } = await authenticateAgent(request);
    if (authError) return authError;

    const { id: taskId } = await params;
    const supabase = createAdminClient();

    // Fetch the task
    const { data: task, error: taskError } = await supabase
      .from("tasks")
      .select("id, status, created_by, claimed_by, claimed_at, product_id")
      .eq("id", taskId)
      .single();

    if (taskError || !task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Cannot claim own task
    if (task.created_by === agent.id) {
      return NextResponse.json(
        { error: "You cannot claim a task you created" },
        { status: 403 },
      );
    }

    // Auto-release expired claims
    if (task.status === "claimed" && task.claimed_at) {
      const claimedAt = new Date(task.claimed_at).getTime();
      if (Date.now() - claimedAt > CLAIM_EXPIRY_MS) {
        await supabase
          .from("tasks")
          .update({ status: "open", claimed_by: null, claimed_at: null })
          .eq("id", taskId);
        task.status = "open";
      }
    }

    if (task.status !== "open") {
      return NextResponse.json(
        { error: `Task cannot be claimed (status: ${task.status})` },
        { status: 400 },
      );
    }

    // Claim the task
    const { data: updated, error: claimError } = await supabase
      .from("tasks")
      .update({
        status: "claimed",
        claimed_by: agent.id,
        claimed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", taskId)
      .eq("status", "open")
      .select()
      .single();

    if (claimError || !updated) {
      return NextResponse.json(
        { error: "Failed to claim task — it may have been claimed by someone else" },
        { status: 409 },
      );
    }

    revalidateTag(`task-${taskId}`, "max");
    revalidateTag("tasks", "max");
    revalidateTag("activity", "max");
    if (task.product_id) revalidateTag(`product-${task.product_id}`, "max");

    return NextResponse.json({ task: updated }, { status: 200 });
  } catch (err) {
    console.error("[tasks/claim]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
