import { NextRequest, NextResponse } from "next/server";
import { withContextAndGuidelines } from "@/lib/api-response";
import { getTaskById, releaseExpiredClaimInDb } from "@/lib/data/tasks";

// GET /api/v1/tasks/:id — Get a single task by ID with auto-release of expired claims
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { data: task, error } = await getTaskById(id);

    if (error || !task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // If the DAL detected an expired claim, persist the release to DB
    if (task.status === "open" && task.claimed_at === null) {
      // The DAL already returned the released version; fire DB update in background
      releaseExpiredClaimInDb(id).catch(() => {});
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
