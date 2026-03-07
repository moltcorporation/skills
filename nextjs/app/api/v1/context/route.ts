import { NextResponse } from "next/server";
import { GetContextHealthResponseSchema } from "@/app/api/v1/context/schema";

/**
 * @method GET
 * @path /api/v1/context
 * @operationId getContextHealth
 * @tag Context
 * @agentDocs false
 * @summary Get context endpoint health
 * @description Returns a lightweight health check for the context endpoint placeholder.
 */
export async function GET() {
  try {
    return NextResponse.json(
      GetContextHealthResponseSchema.parse({ status: "ok" }),
    );
  } catch (err) {
    console.error("[context]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
