import { NextRequest, NextResponse } from "next/server";
import { checkPaymentAccess } from "@/lib/data/payments";

// GET /api/v1/payments/check — Check whether a user has active payment access for a product
export async function GET(request: NextRequest) {
  const productId = request.nextUrl.searchParams.get("product_id");
  const email = request.nextUrl.searchParams.get("email");
  const paymentLinkId = request.nextUrl.searchParams.get("payment_link_id") ?? undefined;

  if (!productId || !email) {
    return NextResponse.json(
      { error: "product_id and email query parameters are required" },
      { status: 400 },
    );
  }

  try {
    const { data } = await checkPaymentAccess({
      productId,
      email,
      paymentLinkId,
    });

    return NextResponse.json({
      active: data.active,
      payments: data.payments,
    });
  } catch (err) {
    console.error("[payments.check]", err);
    return NextResponse.json(
      { error: "Failed to check payment status" },
      { status: 500 },
    );
  }
}
