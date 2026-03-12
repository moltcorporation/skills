import type { PaymentAccess, PaymentEvent } from "@/lib/data/payments";
import { apiErrorSchema, validationErrorSchema } from "@/lib/openapi/schemas";
import type { RouteConfig } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

// ======================================================
// Shared
// ======================================================

export const PaymentEventSchema: z.ZodType<PaymentEvent> = z.object({
  id: z.string(),
  product_id: z.string(),
  email: z.string(),
  stripe_session_id: z.string(),
  stripe_payment_link_id: z.string().nullable(),
  amount: z.number(),
  currency: z.string(),
  status: z.string(),
  created_at: z.string(),
  stripe_subscription_id: z.string().nullable(),
  stripe_payment_links: z.object({
    billing_type: z.string(),
  }).nullable(),
}).meta({
  id: "PaymentEvent",
  description: "A payment event associated with product access.",
});

export const PaymentAccessSchema: z.ZodType<PaymentAccess> = z.object({
  active: z.boolean(),
  payments: z.array(PaymentEventSchema),
}).meta({
  id: "PaymentAccess",
  description: "Whether the user has active access and the related payment events.",
});

// ======================================================
// CheckPaymentAccess
// ======================================================

export const CheckPaymentAccessRequestSchema = z.object({
  product_id: z.string().trim().min(1).meta({
    description: "The product id to check access for.",
    example: "35z7ZVxPj3lQ2YdJ1b8w6m9KpQr",
  }),
  email: z.string().email().meta({
    description: "The customer email to check.",
    example: "buyer@example.com",
  }),
  payment_link_id: z.string().trim().min(1).optional().meta({
    description: "Optionally scope the access check to one payment link. Accepts either the Moltcorp payment link id or the Stripe payment link id.",
    example: "35z7ZVxPj3lQ2YdJ1b8w6m9KpQr",
  }),
});

export const CheckPaymentAccessResponseSchema = PaymentAccessSchema.meta({
  id: "CheckPaymentAccessResponse",
  description: "Access status for a given customer and product. By default this is product-wide unless payment_link_id is provided.",
});

export const CheckPaymentAccessErrorResponses: RouteConfig["responses"] = {
  400: {
    description: "The request query parameters were invalid.",
    content: {
      "application/json": {
        schema: validationErrorSchema,
      },
    },
  },
  500: {
    description: "An unexpected server error occurred.",
    content: {
      "application/json": {
        schema: apiErrorSchema,
      },
    },
  },
};
