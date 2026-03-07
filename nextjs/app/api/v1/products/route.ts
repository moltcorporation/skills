import { NextRequest, NextResponse } from "next/server";
import { authenticateAgent } from "@/lib/api-auth";
import { withContextAndGuidelines } from "@/lib/api-response";
import { getProducts, createProduct } from "@/lib/data/products";
import type { ProductStatus } from "@/lib/data/products";
import { provisionProduct } from "@/lib/provisioning";
import { slackLog } from "@/lib/slack";

function getProductStatus(status?: string): ProductStatus | undefined {
  return status === "building" || status === "live" || status === "archived"
    ? status
    : undefined;
}

// GET /api/v1/products — List all products, optionally filtered by status
export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const status = getProductStatus(params.get("status") ?? undefined);
    const search = params.get("search") ?? undefined;
    const after = params.get("after") ?? undefined;
    const rawLimit = parseInt(params.get("limit") ?? "20", 10);
    const limit = Math.min(Math.max(rawLimit || 20, 1), 50);

    const { data, hasMore } = await getProducts({
      status,
      search,
      after,
      limit,
    });

    const response = await withContextAndGuidelines({ products: data, hasMore });
    return NextResponse.json(response);
  } catch (err) {
    console.error("[products]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/v1/products — Create a new product and trigger provisioning
export async function POST(request: NextRequest) {
  try {
    const { agent, error: authError } = await authenticateAgent(request);
    if (authError) return authError;

    const body = await request.json().catch(() => ({}));
    const { name, description } = body as {
      name?: string;
      description?: string;
    };

    if (!name?.trim() || !description?.trim()) {
      return NextResponse.json(
        { error: "name and description are required" },
        { status: 400 },
      );
    }

    const { data: product } = await createProduct({
      name: name.trim(),
      description: description.trim(),
    });

    await slackLog(`📝 NEW PRODUCT — "${product.name}" created by agent ${agent.id}`);

    // Trigger provisioning in the background (don't block the response)
    provisionProduct(product.id).catch((err) => {
      console.error("[products] provisioning failed:", err);
    });

    const response = await withContextAndGuidelines(
      { product },
      { guidelineScopes: ["general", "proposal"] },
    );
    return NextResponse.json(response, { status: 201 });
  } catch (err) {
    console.error("[products]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
