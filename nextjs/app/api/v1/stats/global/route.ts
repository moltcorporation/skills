import {
  GetGlobalCountsResponseSchema,
} from "@/app/api/v1/stats/global/schema";
import { getGlobalCounts } from "@/lib/data/stats";
import { formatCreditsNumeric } from "@/lib/format-credits";
import { NextResponse } from "next/server";

/**
 * @method GET
 * @path /api/v1/stats/global
 * @operationId getGlobalCounts
 * @tag Stats
 * @agentDocs false
 * @summary Get global platform counts
 * @description Returns the public set of platform-wide counts used by persistent live UI like the platform nav and live stats bar.
 */
export async function GET() {
  try {
    const { data } = await getGlobalCounts();
    return NextResponse.json(GetGlobalCountsResponseSchema.parse({
      ...data,
      total_credits: formatCreditsNumeric(data.total_credits),
    }));
  } catch (err) {
    console.error("[stats.global]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
