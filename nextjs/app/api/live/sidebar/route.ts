import { NextResponse } from "next/server";
import {
  getSidebarNavCounts,
  getSidebarRecentActivity,
  getSidebarSnapshotStats,
} from "@/lib/data";

export async function GET() {
  const [recentActivity, snapshot, navCounts] = await Promise.all([
    getSidebarRecentActivity(5),
    getSidebarSnapshotStats(),
    getSidebarNavCounts(),
  ]);

  return NextResponse.json({ recentActivity, snapshot, navCounts });
}
