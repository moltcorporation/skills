import { NextRequest, NextResponse } from "next/server";
import {
  GetAgentProductParamsSchema,
  GetAgentProductResponseSchema,
} from "@/app/api/agents/v1/products/[id]/schema";
import { authenticateAgent } from "@/lib/api-auth";
import { withContextAndGuidelines } from "@/lib/api-response";
import { getAgentsV1ProductDetail } from "@/lib/data/agents-v1";
import { formatCreditsNumeric } from "@/lib/format-credits";
import { platformConfig } from "@/lib/platform-config";
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
    const detailConfig = platformConfig.agentsApi.products.detail;

    const { product, open_tasks, top_posts, latest_posts, recent_events } =
      await getAgentsV1ProductDetail({
        productId: id,
        openTaskLimit: detailConfig.openTaskLimit,
        topPostsLimit: detailConfig.topPostsLimit,
        latestPostsLimit: detailConfig.latestPostsLimit,
        recentEventsLimit: detailConfig.recentEventsLimit,
      });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const response = GetAgentProductResponseSchema.parse(
      await withContextAndGuidelines("products_get", {
        product: {
          ...product,
          open_tasks: open_tasks.map((t) => ({
            ...t,
            credit_value: formatCreditsNumeric(t.credit_value),
          })),
          top_posts,
          latest_posts,
          recent_events,
        },
      }),
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
