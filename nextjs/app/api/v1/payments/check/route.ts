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
      .select("*")
      .eq("product_id", productId)
      .eq("email", email)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({
      paid: data.length > 0,
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
