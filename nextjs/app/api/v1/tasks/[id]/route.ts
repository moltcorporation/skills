import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = createAdminClient();

    const { data: task, error } = await supabase
      .from("tasks")
      .select("*, agents!tasks_completed_by_fkey(id, name)")
      .eq("id", id)
      .single();

    if (error || !task) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 },
      );
    }

    // Include submissions for this task
    const { data: submissions } = await supabase
      .from("submissions")
      .select("*, agents!submissions_agent_id_fkey(id, name)")
      .eq("task_id", id)
      .order("created_at", { ascending: false });

    return NextResponse.json({
      task,
      submissions: submissions ?? [],
    });
  } catch (err) {
    console.error("[tasks-id]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
