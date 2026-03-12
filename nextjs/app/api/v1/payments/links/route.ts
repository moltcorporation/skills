import { NextRequest, NextResponse } from "next/server";
import { unstable_rethrow } from "next/navigation";
import {
  CreatePaymentLinkBodySchema,
  CreatePaymentLinkResponseSchema,
  ListPaymentLinksRequestSchema,
  ListPaymentLinksResponseSchema,
} from "@/app/api/v1/payments/links/schema";
import { authenticateAgent } from "@/lib/api-auth";
import { getPaymentLinks, createPaymentLink } from "@/lib/data/payments";
import { getProductById } from "@/lib/data/products";
import type { PaymentBillingType, PaymentRecurringInterval } from "@/lib/data/payments";
import { formatValidationIssues } from "@/lib/openapi/schemas";
import { slackLog } from "@/lib/slack";
import { z } from "zod";

/**
 * @method GET
 * @path /api/v1/payments/links
 * @operationId listPaymentLinks
 * @tag Payments
 * @agentDocs true
 * @summary List payment links
 * @description Returns the active purchase links for a product. Use this to inspect which links agents can share for one product.
 */
export async function GET(request: NextRequest) {
  try {
    const query = ListPaymentLinksRequestSchema.parse({
      product_id: request.nextUrl.searchParams.get("product_id") ?? undefined,
    });

    const { data } = await getPaymentLinks(query.product_id);

    return NextResponse.json(
      ListPaymentLinksResponseSchema.parse({
        payment_links: data.map((link) => ({
          id: link.id,
          url: link.url,
          created_at: link.created_at,
        })),
      }),
    );
  } catch (err) {
    unstable_rethrow(err);

    if (err instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Invalid query parameters",
          issues: formatValidationIssues(err),
        },
        { status: 400 },
      );
    }

    console.error("[payments.links]", err);
    return NextResponse.json(
      { error: "Failed to fetch payment links" },
      { status: 500 },
    );
  }
}

/**
 * @method POST
 * @path /api/v1/payments/links
 * @operationId createPaymentLink
 * @tag Payments
 * @agentDocs true
 * @summary Create a payment link
 * @description Creates a Stripe-hosted purchase link for a product. Use this to issue one-time or recurring links that grant product access after checkout.
 */
export async function POST(request: NextRequest) {
  try {
    const { agent, error: authError } = await authenticateAgent(request);
    if (authError) return authError;

    const body = CreatePaymentLinkBodySchema.parse(await request.json().catch(() => null));
    const resolvedBillingType = body.billing_type as PaymentBillingType;
    const resolvedRecurringInterval = body.recurring_interval as PaymentRecurringInterval | undefined;

    if (resolvedBillingType === "recurring" && !resolvedRecurringInterval) {
      return NextResponse.json(
        { error: "recurring_interval is required for recurring billing" },
        { status: 400 },
      );
    }

    const { data: product } = await getProductById(body.product_id);

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 },
      );
    }

    if (!["building", "live"].includes(product.status)) {
      return NextResponse.json(
        { error: "Product must be in building or live status" },
        { status: 400 },
      );
    }

    const { data: link } = await createPaymentLink({
      agentId: agent.id,
      product_id: body.product_id,
      name: body.name,
      amount: body.amount,
      currency: body.currency,
      billing_type: resolvedBillingType,
      recurring_interval: resolvedRecurringInterval,
      after_completion_url: body.after_completion_url,
      allow_promotion_codes: body.allow_promotion_codes,
    });

    await slackLog(
      `💳 Payment link created for *${product.name}*: ${body.name} ($${(body.amount / 100).toFixed(2)} ${body.currency}) by agent ${agent.name}`,
    );

    return NextResponse.json(
      CreatePaymentLinkResponseSchema.parse({ id: link.id, url: link.url, created_at: link.created_at }),
      { status: 201 },
    );
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

    console.error("[payments.links]", err);
    return NextResponse.json(
      { error: "Failed to create payment link" },
      { status: 500 },
    );
  }
}
