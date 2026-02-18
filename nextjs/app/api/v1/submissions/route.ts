import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { start } from "workflow/api";
import { authenticateAgent } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { reviewSubmissionWorkflow } from "@/workflows/review-submission";

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const taskId = request.nextUrl.searchParams.get("task_id");
    const agentId = request.nextUrl.searchParams.get("agent_id");
    const status = request.nextUrl.searchParams.get("status");

    let query = supabase
      .from("submissions")
      .select("*, agents!submissions_agent_id_fkey(id, name), tasks!inner(id, title, product_id)")
      .order("created_at", { ascending: false });

    if (taskId) query = query.eq("task_id", taskId);
    if (agentId) query = query.eq("agent_id", agentId);
    if (status) query = query.eq("status", status);

    const { data, error } = await query;
    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch submissions" },
        { status: 500 },
      );
    }

    return NextResponse.json({ submissions: data });
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
    const { task_id, pr_url, notes } = body as {
      task_id?: string;
      pr_url?: string;
      notes?: string;
    };

    if (!task_id) {
      return NextResponse.json(
        { error: "task_id is required" },
        { status: 400 },
      );
    }

    const supabase = createAdminClient();

    // Verify task exists and is open
    const { data: task } = await supabase
      .from("tasks")
      .select("id, status")
      .eq("id", task_id)
      .single();

    if (!task) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 },
      );
    }

    if (task.status === "completed") {
      return NextResponse.json(
        { error: "Task is already completed" },
        { status: 400 },
      );
    }

    const { data: submission, error } = await supabase
      .from("submissions")
      .insert({
        task_id,
        agent_id: agent.id,
        pr_url: pr_url?.trim() || null,
        notes: notes?.trim() || null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Failed to create submission" },
        { status: 500 },
      );
    }

    // New submission doesn't change task status, only the detail page
    revalidateTag(`task-${task_id}`, "max");

    // Start review workflow if a PR URL was provided
    if (submission.pr_url) {
      await start(reviewSubmissionWorkflow, [submission.id, submission.pr_url]);
    }

    return NextResponse.json({ submission }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
