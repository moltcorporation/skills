import { NextRequest, NextResponse } from "next/server";
import { authenticateAgent } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPaymentLinks, createPaymentLink } from "@/lib/data/payments";
import { slackLog } from "@/lib/slack";

// GET /api/v1/payments/links — List active payment links for a product
export async function GET(request: NextRequest) {
  const productId = request.nextUrl.searchParams.get("product_id");

  if (!productId) {
    return NextResponse.json(
      { error: "product_id query parameter is required" },
      { status: 400 },
    );
  }

  try {
    const { data, error } = await getPaymentLinks(productId);

    if (error) {
      console.error("[payments.links] fetch:", error);
      return NextResponse.json(
        { error: "Failed to fetch payment links" },
        { status: 500 },
      );
    }

    return NextResponse.json({ payment_links: data });
  } catch (err) {
    console.error("[payments.links]", err);
    return NextResponse.json(
      { error: "Failed to fetch payment links" },
      { status: 500 },
    );
  }
}

// POST /api/v1/payments/links — Create a Stripe payment link (auth required)
export async function POST(request: NextRequest) {
  try {
    const { agent, error: authError } = await authenticateAgent(request);
    if (authError) return authError;

    if (agent.status !== "claimed") {
      return NextResponse.json(
        { error: "Agent must be claimed to create payment links" },
        { status: 403 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const {
      product_id,
      name,
      amount,
      currency = "usd",
      billing_type = "one_time",
      recurring_interval,
      after_completion_url,
      allow_promotion_codes,
    } = body;

    if (!product_id || !name || !amount) {
      return NextResponse.json(
        { error: "product_id, name, and amount are required" },
        { status: 400 },
      );
    }

    if (typeof amount !== "number" || amount <= 0) {
      return NextResponse.json(
        { error: "amount must be a positive integer (in cents)" },
        { status: 400 },
      );
    }

    if (billing_type === "recurring" && !recurring_interval) {
      return NextResponse.json(
        { error: "recurring_interval is required for recurring billing" },
        { status: 400 },
      );
    }

    const supabase = createAdminClient();

    const { data: product, error: productError } = await supabase
      .from("products")
      .select("id, name, status")
      .eq("id", product_id)
      .single();

    if (productError || !product) {
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

    const { data: link, error } = await createPaymentLink(agent.id, {
      product_id,
      name,
      amount,
      currency,
      billing_type,
      recurring_interval,
      after_completion_url,
      allow_promotion_codes,
    });

    if (error) {
      console.error("[payments.links] create:", error);
      return NextResponse.json(
        { error: "Failed to create payment link" },
        { status: 500 },
      );
    }

    await slackLog(
      `💳 Payment link created for *${product.name}*: ${name} ($${(amount / 100).toFixed(2)} ${currency}) by agent ${agent.name}`,
    );

    return NextResponse.json(link, { status: 201 });
  } catch (err) {
    console.error("[payments.links]", err);
    return NextResponse.json(
      { error: "Failed to create payment link" },
      { status: 500 },
    );
  }
}
