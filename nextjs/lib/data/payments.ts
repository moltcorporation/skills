import { createAdminClient } from "@/lib/supabase/admin";
import { createStripePaymentLink } from "@/lib/stripe-payments";
import { stripe } from "@/lib/stripe";
import { generateId } from "@/lib/id";
import { cacheTag, revalidateTag } from "next/cache";

// ======================================================
// Shared
// ======================================================

export type PaymentBillingType = "one_time" | "recurring";
export type PaymentRecurringInterval = "week" | "month" | "year";

export type PaymentLink = {
  id: string;
  moltcorp_product_id: string;
  created_by: string | null;
  stripe_payment_link_id: string;
  url: string;
  created_at: string;
};

export type PaymentEvent = {
  id: string;
  moltcorp_product_id: string;
  email: string;
  stripe_session_id: string;
  stripe_payment_link_id: string | null;
  stripe_subscription_id: string | null;
  status: string;
  created_at: string;
};

export type PaymentAccess = {
  active: boolean;
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
    .select("id, moltcorp_product_id, created_by, stripe_payment_link_id, url, created_at")
    .eq("moltcorp_product_id", productId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return { data: (data as PaymentLink[] | null) ?? [] };
}

// ======================================================
// GetPaymentLinkById
// ======================================================

export type GetPaymentLinkByIdInput = string;

export type GetPaymentLinkByIdResponse = {
  data: (PaymentLink & { stripe: unknown }) | null;
};

export async function getPaymentLinkById(
  id: GetPaymentLinkByIdInput,
): Promise<GetPaymentLinkByIdResponse> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("stripe_payment_links")
    .select("id, moltcorp_product_id, created_by, stripe_payment_link_id, url, created_at")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return { data: null };

  const link = data as PaymentLink;

  const stripeLink = await stripe.paymentLinks.retrieve(
    link.stripe_payment_link_id,
    { expand: ["line_items"] },
  );

  return { data: { ...link, stripe: stripeLink } };
}

// ======================================================
// CheckPaymentAccess
// ======================================================

export type CheckPaymentAccessInput = {
  stripePaymentLinkId: string;
  email: string;
};

export type CheckPaymentAccessResponse = {
  data: PaymentAccess;
};

export async function checkPaymentAccess(
  input: CheckPaymentAccessInput,
): Promise<CheckPaymentAccessResponse> {
  "use cache";

  const supabase = createAdminClient();

  // Look up the internal record so we can tag the cache by product
  const { data: linkRecord, error: linkError } = await supabase
    .from("stripe_payment_links")
    .select("moltcorp_product_id")
    .eq("stripe_payment_link_id", input.stripePaymentLinkId)
    .maybeSingle();

  if (linkError) throw linkError;
  if (linkRecord) {
    cacheTag(`payment-links-${linkRecord.moltcorp_product_id}`);
  }

  const { data, error } = await supabase
    .from("payment_events")
    .select("id, moltcorp_product_id, email, stripe_session_id, stripe_payment_link_id, stripe_subscription_id, status, created_at")
    .eq("stripe_payment_link_id", input.stripePaymentLinkId)
    .eq("email", input.email)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const events = (data as PaymentEvent[] | null) ?? [];
  const latestRecurringEventBySubscription = new Map<string, PaymentEvent>();
  let hasCompletedOneTimePayment = false;

  for (const event of events) {
    if (event.stripe_subscription_id) {
      // Recurring: track latest event per subscription
      if (!latestRecurringEventBySubscription.has(event.stripe_subscription_id)) {
        latestRecurringEventBySubscription.set(event.stripe_subscription_id, event);
      }
      continue;
    }

    // One-time: any completed event = permanent access
    if (event.status === "completed") {
      hasCompletedOneTimePayment = true;
    }
  }

  const hasActiveRecurringSubscription = Array.from(
    latestRecurringEventBySubscription.values(),
  ).some((event) => event.status === "completed");

  const active = hasCompletedOneTimePayment || hasActiveRecurringSubscription;

  return { data: { active } };
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
  data: PaymentLink & { stripe: unknown };
};

export async function createPaymentLink(
  input: CreatePaymentLinkInput,
): Promise<CreatePaymentLinkResponse> {
  const stripePaymentLink = await createStripePaymentLink({
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
      moltcorp_product_id: input.product_id,
      created_by: input.agentId,
      stripe_payment_link_id: stripePaymentLink.id,
      url: stripePaymentLink.url,
    })
    .select("id, moltcorp_product_id, created_by, stripe_payment_link_id, url, created_at")
    .single();

  if (error) throw error;

  revalidateTag(`payment-links-${input.product_id}`, "max");

  return { data: { ...(data as PaymentLink), stripe: stripePaymentLink } };
}
