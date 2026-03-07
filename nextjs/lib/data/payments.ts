import { cacheTag } from "next/cache";
import { revalidateTag } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createStripePaymentLink } from "@/lib/stripe-payments";
import { generateId } from "@/lib/id";

export async function getPaymentLinks(productId: string) {
  "use cache";
  cacheTag(`payment-links-${productId}`);


  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("stripe_payment_links")
    .select("*")
    .eq("product_id", productId)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

export async function getPaymentLinkById(id: string) {
  "use cache";
  cacheTag(`payment-link-${id}`);


  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("stripe_payment_links")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

export async function checkPaymentAccess(
  productId: string,
  email: string,
  paymentLinkId?: string,
) {
  "use cache";
  cacheTag(`payment-links-${productId}`);


  const supabase = createAdminClient();
  let query = supabase
    .from("payment_events")
    .select("*, stripe_payment_links!stripe_payment_link_id(billing_type)")
    .eq("product_id", productId)
    .eq("email", email);

  if (paymentLinkId) {
    query = query.eq("stripe_payment_link_id", paymentLinkId);
  }

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) return { data: null, error: error.message };

  const active = (data ?? []).some((event: Record<string, unknown>) => {
    const billingType =
      (event.stripe_payment_links as Record<string, unknown>)?.billing_type ?? "one_time";
    if (billingType === "one_time") {
      return event.status === "completed";
    }
    return event.status === "completed";
  });

  return { data: { active, payments: data }, error: null };
}

export async function createPaymentLink(
  agentId: string,
  input: {
    product_id: string;
    name: string;
    amount: number;
    currency?: string;
    billing_type?: string;
    recurring_interval?: string;
    after_completion_url?: string;
    allow_promotion_codes?: boolean;
  },
) {
  const stripeResult = await createStripePaymentLink({
    productId: input.product_id,
    name: input.name,
    amount: input.amount,
    currency: input.currency,
    billingType: input.billing_type as "one_time" | "recurring" | undefined,
    recurringInterval: input.recurring_interval as "month" | "year" | "week" | undefined,
    afterCompletionUrl: input.after_completion_url,
    allowPromotionCodes: input.allow_promotion_codes,
  });

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("stripe_payment_links")
    .insert({
      id: generateId(),
      product_id: input.product_id,
      created_by: agentId,
      stripe_product_id: stripeResult.stripeProductId,
      stripe_price_id: stripeResult.stripePriceId,
      stripe_payment_link_id: stripeResult.stripePaymentLinkId,
      url: stripeResult.url,
      name: input.name,
      amount: input.amount,
      currency: input.currency ?? "usd",
      billing_type: input.billing_type ?? "one_time",
      recurring_interval: input.recurring_interval ?? null,
    })
    .select()
    .single();

  if (error) return { data: null, error: error.message };

  revalidateTag(`payment-links-${input.product_id}`, "max");

  return { data, error: null };
}
