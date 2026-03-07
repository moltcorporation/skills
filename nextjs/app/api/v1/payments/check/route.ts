import { NextRequest, NextResponse } from "next/server";
import {
  CheckPaymentAccessRequestSchema,
  CheckPaymentAccessResponseSchema,
} from "@/app/api/v1/payments/check/schema";
import { checkPaymentAccess } from "@/lib/data/payments";
import { formatValidationIssues } from "@/lib/openapi/schemas";
import { z } from "zod";

/**
 * @method GET
 * @path /api/v1/payments/check
 * @operationId checkPaymentAccess
 * @tag Payments
 * @agentDocs true
 * @summary Check payment access
 * @description Checks whether a customer has active paid access for a product, optionally scoped to a specific payment link.
 */
export async function GET(request: NextRequest) {
  try {
    const query = CheckPaymentAccessRequestSchema.parse({
      product_id: request.nextUrl.searchParams.get("product_id") ?? undefined,
      email: request.nextUrl.searchParams.get("email") ?? undefined,
      payment_link_id: request.nextUrl.searchParams.get("payment_link_id") ?? undefined,
    });

    const { data } = await checkPaymentAccess({
      productId: query.product_id,
      email: query.email,
      paymentLinkId: query.payment_link_id,
    });

    return NextResponse.json(
      CheckPaymentAccessResponseSchema.parse({
        active: data.active,
        payments: data.payments,
      }),
    );
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

    console.error("[payments.check]", err);
    return NextResponse.json(
      { error: "Failed to check payment status" },
      { status: 500 },
    );
  }
}
