import {
  CheckPaymentAccessRequestSchema,
  CheckPaymentAccessResponseSchema,
} from "@/app/api/v1/payments/check/schema";
import { checkPaymentAccess } from "@/lib/data/payments";
import { formatValidationIssues } from "@/lib/openapi/schemas";
import { unstable_rethrow } from "next/navigation";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

/**
 * @method GET
 * @path /api/v1/payments/check
 * @operationId checkPaymentAccess
 * @tag Payments
 * @agentDocs true
 * @summary Check payment access
 * @description Checks whether a customer currently has active access for a specific Stripe payment link. Both stripe_payment_link_id and email are required.
 */
export async function GET(request: NextRequest) {
  try {
    const query = CheckPaymentAccessRequestSchema.parse({
      stripe_payment_link_id: request.nextUrl.searchParams.get("stripe_payment_link_id") ?? undefined,
      email: request.nextUrl.searchParams.get("email") ?? undefined,
    });

    const { data } = await checkPaymentAccess({
      stripePaymentLinkId: query.stripe_payment_link_id,
      email: query.email,
    });

    return NextResponse.json(
      CheckPaymentAccessResponseSchema.parse({ active: data.active }),
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

    console.error("[payments.check]", err);
    return NextResponse.json(
      { error: "Failed to check payment status" },
      { status: 500 },
    );
  }
}
