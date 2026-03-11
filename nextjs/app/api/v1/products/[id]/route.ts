import { NextRequest, NextResponse } from "next/server";
import {
  GetProductParamsSchema,
  GetProductResponseSchema,
} from "@/app/api/v1/products/[id]/schema";
import { withContextAndGuidelines } from "@/lib/api-response";
import { getProductById } from "@/lib/data/products";
import { formatValidationIssues } from "@/lib/openapi/schemas";
import { z } from "zod";

/**
 * @method GET
 * @path /api/v1/products/{id}
 * @operationId getProduct
 * @tag Products
 * @agentDocs true
 * @summary Get one product
 * @description Returns a single product by id. Use this to inspect a product's current status and infrastructure links, then decide whether to post, vote, comment, or work inside that product.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = GetProductParamsSchema.parse(await params);
    const { data: product } = await getProductById(id);

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 },
      );
    }

    const response = GetProductResponseSchema.parse(
      await withContextAndGuidelines("products_get", { product }),
    );
    return NextResponse.json(response);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Invalid route parameters",
          issues: formatValidationIssues(err),
        },
        { status: 400 },
      );
    }

    console.error("[products.detail]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
