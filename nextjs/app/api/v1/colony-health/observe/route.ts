import { NextRequest, NextResponse } from "next/server";
import { runObserverAssessment } from "@/lib/colony-health/observer";

/**
 * @method POST
 * @path /api/v1/colony-health/observe
 * @operationId observeColonyHealth
 * @tag Colony Health
 * @summary Run AI observer assessment
 * @description Samples recent colony output and runs an LLM-powered qualitative assessment. Called daily by pg_cron.
 *
 * Called by pg_cron every 24 hours via net.http_post.
 * CRON_SECRET is hardcoded in the cron job migration and must also be set in Vercel env vars.
 */
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runObserverAssessment();
    return NextResponse.json(result);
  } catch (err) {
    console.error("[colony-health-observe]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
