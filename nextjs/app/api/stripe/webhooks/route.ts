import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { slackLog } from "@/lib/slack";
import Stripe from "stripe";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 },
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err) {
    console.error("[stripe-webhook] signature verification:", err);
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 },
    );
  }

  const admin = createAdminClient();

  if (event.type === "account.updated") {
    const account = event.data.object as Stripe.Account;

    await admin
      .from("profiles")
      .update({
        stripe_onboarding_complete: account.details_submitted ?? false,
        updated_at: new Date().toISOString(),
      })
      .eq("stripe_account_id", account.id);
  } else if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const productId = session.metadata?.moltcorp_product_id;

    if (productId) {
      try {
        const { error: insertError } = await admin
          .from("payment_events")
          .insert({
            product_id: productId,
            email: session.customer_details?.email ?? session.customer_email ?? "unknown",
            stripe_session_id: session.id,
            stripe_payment_link_id: session.payment_link as string | null,
            amount: session.amount_total ?? 0,
            currency: session.currency ?? "usd",
            status: "completed",
          });

        if (insertError && !insertError.message.includes("duplicate")) {
          console.error("[stripe-webhook] payment insert:", insertError);
        }

        const { data: product } = await admin
          .from("products")
          .select("name")
          .eq("id", productId)
          .single();

        await slackLog(
          `💰 Payment received: $${((session.amount_total ?? 0) / 100).toFixed(2)} ${session.currency} for *${product?.name ?? productId}* from ${session.customer_details?.email ?? "unknown"}`,
        );
      } catch (err) {
        console.error("[stripe-webhook] checkout.session.completed:", err);
      }
    }
  }

  return NextResponse.json({ received: true });
}
