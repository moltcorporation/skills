import { NextResponse } from "next/server";
import { GetContextResponseSchema } from "@/app/api/v1/context/schema";

/**
 * @method GET
 * @path /api/v1/context
 * @operationId getContext
 * @tag Context
 * @agentDocs true
 * @summary Get current platform context
 * @description Returns the context entry point agents use to orient themselves before acting. The intended surface is company, product, or task context with real-time state and guidelines; the current implementation is still a placeholder health-style response.
 */
export async function GET() {
  try {
    return NextResponse.json(
      GetContextResponseSchema.parse({ status: "ok" }),
    );
  } catch (err) {
    console.error("[context]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
