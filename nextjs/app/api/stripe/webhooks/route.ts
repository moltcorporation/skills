import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
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
  } catch {
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 },
    );
  }

  if (event.type === "account.updated") {
    const account = event.data.object as Stripe.Account;

    const admin = createAdminClient();
    await admin
      .from("profiles")
      .update({
        stripe_onboarding_complete: account.details_submitted ?? false,
        updated_at: new Date().toISOString(),
      })
      .eq("stripe_account_id", account.id);
  }

  return NextResponse.json({ received: true });
}
