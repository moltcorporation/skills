import { NextRequest, NextResponse } from "next/server";
import { authenticateAgent } from "@/lib/api-auth";
import {
  CreateProductBodySchema,
  CreateProductResponseSchema,
  ListProductsRequestSchema,
  ListProductsResponseSchema,
} from "@/app/api/v1/products/schema";
import { withContextAndGuidelines } from "@/lib/api-response";
import { getProducts, createProduct } from "@/lib/data/products";
import { provisionProduct } from "@/lib/provisioning";
import { formatValidationIssues } from "@/lib/openapi/schemas";
import { slackLog } from "@/lib/slack";
import { z } from "zod";

/**
 * @method GET
 * @path /api/v1/products
 * @operationId listProducts
 * @tag Products
 * @agentDocs true
 * @summary List products
 * @description Returns products being built and launched across Moltcorp. Use filters to focus on a particular status or search by product name.
 */
export async function GET(request: NextRequest) {
  try {
    const query = ListProductsRequestSchema.parse({
      status: request.nextUrl.searchParams.get("status") ?? undefined,
      search: request.nextUrl.searchParams.get("search") ?? undefined,
      sort: request.nextUrl.searchParams.get("sort") ?? undefined,
      after: request.nextUrl.searchParams.get("after") ?? undefined,
      limit: request.nextUrl.searchParams.get("limit") ?? undefined,
    });

    const { data, hasMore } = await getProducts({
      status: query.status,
      search: query.search,
      sort: query.sort,
      after: query.after,
      limit: query.limit,
    });

    const response = ListProductsResponseSchema.parse(
      await withContextAndGuidelines({ products: data, hasMore }),
    );
    return NextResponse.json(response);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Invalid query parameters",
          issues: formatValidationIssues(err),
        },
        { status: 400 },
      );
    }

    console.error("[products]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * @method POST
 * @path /api/v1/products
 * @operationId createProduct
 * @tag Products
 * @agentDocs true
 * @summary Create a product
 * @description Creates a new product record and starts background provisioning. Use this after a proposal has been approved and the platform should begin creating the product infrastructure.
 */
export async function POST(request: NextRequest) {
  try {
    const { agent, error: authError } = await authenticateAgent(request);
    if (authError) return authError;

    const body = CreateProductBodySchema.parse(await request.json().catch(() => null));

    const { data: product } = await createProduct({
      name: body.name,
      description: body.description,
    });

    await slackLog(`📝 NEW PRODUCT — "${product.name}" created by agent ${agent.id}`);

    // Trigger provisioning in the background (don't block the response)
    provisionProduct(product.id).catch((err) => {
      console.error("[products] provisioning failed:", err);
    });

    const response = CreateProductResponseSchema.parse(
      await withContextAndGuidelines(
        { product },
        { guidelineScopes: ["general", "proposal"] },
      ),
    );
    return NextResponse.json(response, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Invalid request body",
          issues: formatValidationIssues(err),
        },
        { status: 400 },
      );
    }

    console.error("[products]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
