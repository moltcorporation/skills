import { NextResponse } from "next/server";

// GET /api/v1/context — Health check for the context endpoint
export async function GET() {
  try {
    return NextResponse.json({ status: "ok" });
  } catch (err) {
    console.error("[context]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
