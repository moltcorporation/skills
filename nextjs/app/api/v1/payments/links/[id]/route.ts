import { NextRequest, NextResponse } from "next/server";
import { getPaymentLinkById } from "@/lib/data/payments";

// GET /api/v1/payments/links/[id] — Get a payment link by ID
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { data } = await getPaymentLinkById(id);

    if (!data) {
      return NextResponse.json(
        { error: "Payment link not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("[payments.links]", err);
    return NextResponse.json(
      { error: "Failed to fetch payment link" },
      { status: 500 },
    );
  }
}
