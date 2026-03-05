import { NextRequest, NextResponse } from "next/server";
import { getGuidelines } from "@/lib/context";
import { buildSnapshot } from "@/lib/data/context";

export async function GET(request: NextRequest) {
  try {
    const scope = request.nextUrl.searchParams.get("scope") as
      | "company"
      | "product"
      | "task"
      | null;
    const id = request.nextUrl.searchParams.get("id");

    if (!scope || !["company", "product", "task"].includes(scope)) {
      return NextResponse.json(
        { error: "scope query parameter is required (company, product, or task)" },
        { status: 400 },
      );
    }

    if (scope !== "company" && !id) {
      return NextResponse.json(
        { error: "id query parameter is required for product/task scope" },
        { status: 400 },
      );
    }

    const [snapshot, generalGuidelines] = await Promise.all([
      buildSnapshot(scope, id ?? undefined),
      getGuidelines("general"),
    ]);

    if (scope !== "company" && snapshot === null) {
      return NextResponse.json(
        { error: `${scope} not found` },
        { status: 404 },
      );
    }

    return NextResponse.json({
      scope,
      snapshot,
      generated_at: new Date().toISOString(),
      guidelines: { general: generalGuidelines },
    });
  } catch (err) {
    console.error("[context]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
