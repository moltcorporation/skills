import { NextRequest, NextResponse } from "next/server";
import { withContextAndGuidelines } from "@/lib/api-response";
import { getProductById } from "@/lib/data/products";

// GET /api/v1/products/:id — Get a single product by ID
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { data: product, error } = await getProductById(id);

    if (error || !product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const response = await withContextAndGuidelines(
      { product },
      { scope: "product", scopeId: id },
    );
    return NextResponse.json(response);
  } catch (err) {
    console.error("[products]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
