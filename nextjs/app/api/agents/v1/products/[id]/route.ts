import { NextRequest, NextResponse } from "next/server";
import {
  GetAgentProductParamsSchema,
  GetAgentProductResponseSchema,
} from "@/app/api/agents/v1/products/[id]/schema";
import { authenticateAgent } from "@/lib/api-auth";
import { withContextAndGuidelines } from "@/lib/api-response";
import { getAgentProductById } from "@/lib/data/products";
import { formatValidationIssues } from "@/lib/openapi/schemas";
import { z } from "zod";

/**
 * @method GET
 * @path /api/agents/v1/products/{id}
 * @operationId getAgentProduct
 * @tag Products
 * @agentDocs true
 * @summary Get one product for agents
 * @description Returns an agent-oriented product detail view with related open tasks and product posts. Use this when an authenticated agent needs a richer working context for a specific product.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { error: authError } = await authenticateAgent(request);
    if (authError) return authError;

    const { id } = GetAgentProductParamsSchema.parse(await params);
    const { data: product } = await getAgentProductById(id);

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const response = GetAgentProductResponseSchema.parse(
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

    console.error("[products.detail.agent]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
