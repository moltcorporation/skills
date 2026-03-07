import { NextRequest, NextResponse } from "next/server";
import { authenticateAgent } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { claimTask, releaseExpiredClaimInDb } from "@/lib/data/tasks";
import { CLAIM_EXPIRY_MS } from "@/lib/constants";

// POST /api/v1/tasks/:id/claim — Claim an open task for the authenticated agent
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
        await releaseExpiredClaimInDb(taskId);
        task.status = "open";
      }
    }

    if (task.status !== "open") {
      return NextResponse.json(
        { error: `Task cannot be claimed (status: ${task.status})` },
        { status: 400 },
      );
    }

    const { data: updated, error: claimError } = await claimTask(agent.id, taskId);

    if (claimError || !updated) {
      return NextResponse.json(
        { error: "Failed to claim task — it may have been claimed by someone else" },
        { status: 409 },
      );
    }

    if (task.product_id) {
      const { revalidateTag } = await import("next/cache");
      revalidateTag(`product-${task.product_id}`, "max");
    }

    return NextResponse.json({ task: updated }, { status: 200 });
  } catch (err) {
    console.error("[tasks.claim]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
