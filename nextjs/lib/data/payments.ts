import { createAdminClient } from "@/lib/supabase/admin";
import { createStripePaymentLink } from "@/lib/stripe-payments";
import { generateId } from "@/lib/id";
import { cacheTag, revalidateTag } from "next/cache";

// ======================================================
// Shared
// ======================================================

export type PaymentBillingType = "one_time" | "recurring";
export type PaymentRecurringInterval = "week" | "month" | "year";

export type PaymentLink = {
  id: string;
  product_id: string;
  created_by: string | null;
  stripe_product_id: string;
  stripe_price_id: string;
  stripe_payment_link_id: string;
  url: string;
  name: string;
  amount: number;
  currency: string;
  billing_type: string;
  recurring_interval: string | null;
  is_active: boolean;
  created_at: string;
};

export type PaymentEvent = {
  id: string;
  product_id: string;
  email: string;
  stripe_session_id: string;
  stripe_payment_link_id: string | null;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
  stripe_subscription_id: string | null;
  stripe_payment_links: {
    billing_type: string;
  } | null;
};

export type PaymentAccess = {
  active: boolean;
  payments: PaymentEvent[];
};

// ======================================================
// GetPaymentLinks
// ======================================================

export type GetPaymentLinksInput = string;

export type GetPaymentLinksResponse = {
  data: PaymentLink[];
};

export async function getPaymentLinks(
  productId: GetPaymentLinksInput,
): Promise<GetPaymentLinksResponse> {
  "use cache";
  cacheTag(`payment-links-${productId}`);

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("stripe_payment_links")
    .select("*")
    .eq("product_id", productId)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return { data: (data as PaymentLink[] | null) ?? [] };
}

// ======================================================
// GetPaymentLinkById
// ======================================================

export type GetPaymentLinkByIdInput = string;

export type GetPaymentLinkByIdResponse = {
  data: PaymentLink | null;
};

export async function getPaymentLinkById(
  id: GetPaymentLinkByIdInput,
): Promise<GetPaymentLinkByIdResponse> {
  "use cache";
  cacheTag(`payment-link-${id}`);

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("stripe_payment_links")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return { data: (data as PaymentLink | null) ?? null };
}

// ======================================================
// CheckPaymentAccess
// ======================================================

export type CheckPaymentAccessInput = {
  productId: string;
  email: string;
  paymentLinkId?: string;
};

export type CheckPaymentAccessResponse = {
  data: PaymentAccess;
};

export async function checkPaymentAccess(
  input: CheckPaymentAccessInput,
): Promise<CheckPaymentAccessResponse> {
  "use cache";
  cacheTag(`payment-links-${input.productId}`);

  const supabase = createAdminClient();
  let query = supabase
    .from("payment_events")
    .select("*, stripe_payment_links!stripe_payment_link_id(billing_type)")
    .eq("product_id", input.productId)
    .eq("email", input.email);

  if (input.paymentLinkId) {
    query = query.eq("stripe_payment_link_id", input.paymentLinkId);
  }

  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw error;

  const payments = (data as PaymentEvent[] | null) ?? [];
  const active = payments.some((event) => event.status === "completed");

  return { data: { active, payments } };
}

// ======================================================
// CreatePaymentLink
// ======================================================

export type CreatePaymentLinkInput = {
  agentId: string;
  product_id: string;
  name: string;
  amount: number;
  currency?: string;
  billing_type?: PaymentBillingType;
  recurring_interval?: PaymentRecurringInterval;
  after_completion_url?: string;
  allow_promotion_codes?: boolean;
};

export type CreatePaymentLinkResponse = {
  data: PaymentLink;
};

export async function createPaymentLink(
  input: CreatePaymentLinkInput,
): Promise<CreatePaymentLinkResponse> {
  const stripeResult = await createStripePaymentLink({
    productId: input.product_id,
    name: input.name,
    amount: input.amount,
    currency: input.currency,
    billingType: input.billing_type,
    recurringInterval: input.recurring_interval,
    afterCompletionUrl: input.after_completion_url,
    allowPromotionCodes: input.allow_promotion_codes,
  });

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("stripe_payment_links")
    .insert({
      id: generateId(),
      product_id: input.product_id,
      created_by: input.agentId,
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

  if (error) throw error;

  revalidateTag(`payment-links-${input.product_id}`, "max");

  return { data: data as PaymentLink };
}
