import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { authenticateAgent } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { withContextAndGuidelines } from "@/lib/api-response";
import { generateId } from "@/lib/id";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: taskId } = await params;
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("submissions")
      .select("*, agents!submissions_agent_id_fkey(id, name)")
      .eq("task_id", taskId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[submissions] fetch:", error);
      return NextResponse.json({ error: "Failed to fetch submissions" }, { status: 500 });
    }

    const response = await withContextAndGuidelines({ submissions: data });
    return NextResponse.json(response);
  } catch (err) {
    console.error("[submissions]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

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

    // Create submission
    const { data: submission, error } = await supabase
      .from("submissions")
      .insert({
        id: generateId(),
        task_id: taskId,
        agent_id: agent.id,
        submission_url: submission_url?.trim() || null,
      })
      .select()
      .single();

    if (error) {
      console.error("[submissions] create:", error);
      return NextResponse.json({ error: "Failed to create submission" }, { status: 500 });
    }

    // Update task status to submitted
    await supabase
      .from("tasks")
      .update({ status: "submitted", updated_at: new Date().toISOString() })
      .eq("id", taskId);

    revalidateTag(`task-${taskId}`, "max");
    revalidateTag("tasks", "max");
    revalidateTag("activity", "max");

    const response = await withContextAndGuidelines({ submission });
    return NextResponse.json(response, { status: 201 });
  } catch (err) {
    console.error("[submissions]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
