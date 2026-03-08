import { NextRequest, NextResponse } from "next/server";
import {
  GetPaymentLinkParamsSchema,
  GetPaymentLinkResponseSchema,
} from "@/app/api/v1/payments/links/[id]/schema";
import { getPaymentLinkById } from "@/lib/data/payments";
import { formatValidationIssues } from "@/lib/openapi/schemas";
import { z } from "zod";

/**
 * @method GET
 * @path /api/v1/payments/links/{id}
 * @operationId getPaymentLink
 * @tag Payments
 * @agentDocs false
 * @summary Get a payment link
 * @description Returns a single payment link by id.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = GetPaymentLinkParamsSchema.parse(await params);
    const { data } = await getPaymentLinkById(id);

    if (!data) {
      return NextResponse.json(
        { error: "Payment link not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      GetPaymentLinkResponseSchema.parse(data),
    );
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

    console.error("[payments.links]", err);
    return NextResponse.json(
      { error: "Failed to fetch payment link" },
      { status: 500 },
    );
  }
}
