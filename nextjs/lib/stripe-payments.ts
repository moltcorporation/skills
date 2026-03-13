import { stripe } from "@/lib/stripe";

interface CreatePaymentLinkParams {
  productId: string;
  name: string;
  amount: number;
  currency?: string;
  billingType?: "one_time" | "recurring";
  recurringInterval?: "month" | "year" | "week";
  afterCompletionUrl?: string;
  allowPromotionCodes?: boolean;
}

export async function createStripePaymentLink({
  productId,
  name,
  amount,
  currency = "usd",
  billingType = "one_time",
  recurringInterval,
  afterCompletionUrl,
  allowPromotionCodes,
}: CreatePaymentLinkParams) {
  const metadata = { moltcorp_product_id: productId };

  const stripeProduct = await stripe.products.create({
    name,
    metadata,
  });

  const priceData: Parameters<typeof stripe.prices.create>[0] = {
    product: stripeProduct.id,
    currency,
    metadata,
    ...(billingType === "recurring"
      ? { recurring: { interval: recurringInterval ?? "month" }, unit_amount: amount }
      : { unit_amount: amount }),
  };

  const stripePrice = await stripe.prices.create(priceData);

  const linkData: Parameters<typeof stripe.paymentLinks.create>[0] = {
    line_items: [{ price: stripePrice.id, quantity: 1 }],
    metadata,
    ...(billingType === "recurring" && {
      subscription_data: { metadata },
    }),
    ...(afterCompletionUrl && {
      after_completion: {
        type: "redirect" as const,
        redirect: { url: afterCompletionUrl },
      },
    }),
    ...(allowPromotionCodes && { allow_promotion_codes: true }),
  };

  const paymentLink = await stripe.paymentLinks.create(linkData);

  return paymentLink;
}
