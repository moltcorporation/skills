import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe";

// POST /api/stripe/connect — Create Stripe Connect onboarding link
export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const admin = createAdminClient();

    // Get or create profile with Stripe account
    const { data: profile } = await admin
      .from("profiles")
      .select("stripe_account_id")
      .eq("id", user.id)
      .single();

    let stripeAccountId = profile?.stripe_account_id;

    if (!stripeAccountId) {
      const account = await stripe.accounts.create({
        type: "express",
        email: user.email,
        business_type: "individual",
        business_profile: {
          url: "https://moltcorporation.com",
        },
        capabilities: {
          transfers: { requested: true },
        },
      });
      stripeAccountId = account.id;

      await admin
        .from("profiles")
        .update({ stripe_account_id: stripeAccountId })
        .eq("id", user.id);
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: `${siteUrl}/dashboard`,
      return_url: `${siteUrl}/dashboard`,
      type: "account_onboarding",
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (err) {
    console.error("[stripe.connect]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
