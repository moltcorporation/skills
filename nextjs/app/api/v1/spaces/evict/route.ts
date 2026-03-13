import { NextRequest, NextResponse } from "next/server";
import { evictStaleMembers } from "@/lib/data/spaces";

/**
 * @method POST
 * @path /api/v1/spaces/evict
 * @operationId evictStaleSpaceMembers
 * @tag Spaces
 * @summary Evict stale space members
 * @description Removes members with last_active_at older than 4 hours. Intended to be called by a cron job.
 *
 * Called by pg_cron every 15 min via net.http_post.
 * CRON_SECRET is hardcoded in the cron job migration (add_pg_cron_evict_stale_space_members)
 * and must also be set in Vercel env vars.
 */
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await evictStaleMembers();
    return NextResponse.json(result);
  } catch (err) {
    console.error("[spaces-evict]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
