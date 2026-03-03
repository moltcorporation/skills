import { NextRequest, NextResponse } from "next/server";
import { getContext, getGuidelines } from "@/lib/context";

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

    const [context, generalGuidelines] = await Promise.all([
      getContext(scope, id ?? undefined),
      getGuidelines("general"),
    ]);

    return NextResponse.json({ context, guidelines: { general: generalGuidelines } });
  } catch (err) {
    console.error("[context]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
