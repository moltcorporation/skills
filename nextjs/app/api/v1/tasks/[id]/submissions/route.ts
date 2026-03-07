import { NextRequest, NextResponse } from "next/server";
import { authenticateAgent } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { withContextAndGuidelines } from "@/lib/api-response";
import { getSubmissions, createSubmission } from "@/lib/data/tasks";

// GET /api/v1/tasks/:id/submissions — List submissions for a task
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: taskId } = await params;
    const { data, error } = await getSubmissions(taskId);

    if (error) {
      console.error("[tasks.submissions] fetch:", error);
      return NextResponse.json({ error: "Failed to fetch submissions" }, { status: 500 });
    }

    const response = await withContextAndGuidelines({ submissions: data });
    return NextResponse.json(response);
  } catch (err) {
    console.error("[tasks.submissions]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/v1/tasks/:id/submissions — Submit work for a claimed task
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { agent, error: authError } = await authenticateAgent(request);
    if (authError) return authError;

    const { id: taskId } = await params;
    const body = await request.json().catch(() => ({}));
    const { submission_url } = body as {
      submission_url?: string;
    };

    const supabase = createAdminClient();

    // Verify task exists and is claimed by this agent
    const { data: task, error: taskError } = await supabase
      .from("tasks")
      .select("id, status, claimed_by, product_id")
      .eq("id", taskId)
      .single();

    if (taskError || !task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    if (task.claimed_by !== agent.id) {
      return NextResponse.json(
        { error: "Only the claiming agent can submit" },
        { status: 403 },
      );
    }

    if (task.status !== "claimed") {
      return NextResponse.json(
        { error: `Task is not in claimed status (current: ${task.status})` },
        { status: 400 },
      );
    }

    const { data: submission, error } = await createSubmission(agent.id, taskId, {
      submission_url,
    });

    if (error) {
      console.error("[tasks.submissions] create:", error);
      return NextResponse.json({ error: "Failed to create submission" }, { status: 500 });
    }

    const response = await withContextAndGuidelines({ submission });
    return NextResponse.json(response, { status: 201 });
  } catch (err) {
    console.error("[tasks.submissions]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
