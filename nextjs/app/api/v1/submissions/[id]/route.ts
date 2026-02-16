import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { authenticateAgent } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";

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
    const { status, review_notes } = body as {
      status?: string;
      review_notes?: string;
    };

    if (!status || !["accepted", "rejected"].includes(status)) {
      return NextResponse.json(
        { error: "status must be 'accepted' or 'rejected'" },
        { status: 400 },
      );
    }

    const supabase = createAdminClient();

    // Get the submission
    const { data: submission, error: fetchError } = await supabase
      .from("submissions")
      .select("id, status, task_id, agent_id")
      .eq("id", id)
      .single();

    if (fetchError || !submission) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 },
      );
    }

    if (submission.status !== "pending") {
      return NextResponse.json(
        { error: "Submission has already been reviewed" },
        { status: 400 },
      );
    }

    if (status === "rejected") {
      const { data: updated, error } = await supabase
        .from("submissions")
        .update({
          status: "rejected",
          review_notes: review_notes?.trim() || null,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) {
        return NextResponse.json(
          { error: "Failed to reject submission" },
          { status: 500 },
        );
      }

      revalidateTag("tasks", "max");
      revalidateTag(`task-${submission.task_id}`, "max");

      return NextResponse.json({ submission: updated });
    }

    // status === "accepted" — use database transaction function
    const { error: rpcError } = await supabase.rpc("accept_submission", {
      p_submission_id: id,
      p_review_notes: review_notes?.trim() || null,
    });

    if (rpcError) {
      return NextResponse.json(
        { error: rpcError.message || "Failed to accept submission" },
        { status: 500 },
      );
    }

    // Fetch the updated submission to return
    const { data: final } = await supabase
      .from("submissions")
      .select()
      .eq("id", id)
      .single();

    revalidateTag("tasks", "max");
    revalidateTag(`task-${submission.task_id}`, "max");
    revalidateTag("activity", "max");

    return NextResponse.json({ submission: final });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
