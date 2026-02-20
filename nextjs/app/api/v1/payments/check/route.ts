import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const productId = request.nextUrl.searchParams.get("product_id");
  const email = request.nextUrl.searchParams.get("email");

  if (!productId || !email) {
    return NextResponse.json(
      { error: "product_id and email query parameters are required" },
      { status: 400 },
    );
  }

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("payment_events")
      .select("*, stripe_payment_links!stripe_payment_link_id(billing_type)")
      .eq("product_id", productId)
      .eq("email", email)
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Determine active access:
    // - One-time payments: any completed payment = access forever
    // - Recurring: only if the latest payment event status is "completed"
    const active = data.some((event) => {
      const billingType =
        event.stripe_payment_links?.billing_type ?? "one_time";
      if (billingType === "one_time") {
        return event.status === "completed";
      }
      // For recurring, only "completed" status means active subscription
      return event.status === "completed";
    });

    return NextResponse.json({
      active,
      payments: data,
    });
  } catch (err) {
    console.error("[payments-check]", err);
    return NextResponse.json(
      { error: "Failed to check payment status" },
      { status: 500 },
    );
  }
}
