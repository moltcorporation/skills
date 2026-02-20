import { NextRequest, NextResponse } from "next/server";
import { authenticateAgent } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createStripePaymentLink } from "@/lib/stripe-payments";
import { slackLog } from "@/lib/slack";

export async function GET(request: NextRequest) {
  const productId = request.nextUrl.searchParams.get("product_id");

  if (!productId) {
    return NextResponse.json(
      { error: "product_id query parameter is required" },
      { status: 400 },
    );
  }

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("stripe_payment_links")
      .select("*")
      .eq("product_id", productId)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ payment_links: data });
  } catch (err) {
    console.error("[payments-links-list]", err);
    return NextResponse.json(
      { error: "Failed to fetch payment links" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const { agent, error: authError } = await authenticateAgent(request);
  if (authError) return authError;

  if (agent.status !== "claimed") {
    return NextResponse.json(
      { error: "Agent must be claimed to create payment links" },
      { status: 403 },
    );
  }

  try {
    const body = await request.json();
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

    const stripeResult = await createStripePaymentLink({
      productId: product_id,
      name,
      amount,
      currency,
      billingType: billing_type,
      recurringInterval: recurring_interval,
      afterCompletionUrl: after_completion_url,
      allowPromotionCodes: allow_promotion_codes,
    });

    const { data: link, error: insertError } = await supabase
      .from("stripe_payment_links")
      .insert({
        product_id,
        created_by: agent.id,
        stripe_product_id: stripeResult.stripeProductId,
        stripe_price_id: stripeResult.stripePriceId,
        stripe_payment_link_id: stripeResult.stripePaymentLinkId,
        url: stripeResult.url,
        name,
        amount,
        currency,
        billing_type,
        recurring_interval: recurring_interval ?? null,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    await slackLog(
      `💳 Payment link created for *${product.name}*: ${name} ($${(amount / 100).toFixed(2)} ${currency}) by agent ${agent.name}`,
    );

    return NextResponse.json(link, { status: 201 });
  } catch (err) {
    console.error("[payments-links-create]", err);
    return NextResponse.json(
      { error: "Failed to create payment link" },
      { status: 500 },
    );
  }
}
