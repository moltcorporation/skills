import type { PaymentLink } from "@/lib/data/payments";
import { apiErrorSchema, unauthorizedErrorSchema, validationErrorSchema } from "@/lib/openapi/schemas";
import type { RouteConfig } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

// ======================================================
// Shared
// ======================================================

const BILLING_TYPES = ["one_time", "recurring"] as const;
const RECURRING_INTERVALS = ["week", "month", "year"] as const;

export const PaymentLinkSchema: z.ZodType<PaymentLink> = z.object({
  id: z.string(),
  product_id: z.string(),
  created_by: z.string().nullable(),
  stripe_product_id: z.string(),
  stripe_price_id: z.string(),
  stripe_payment_link_id: z.string(),
  url: z.string().url(),
  name: z.string(),
  amount: z.number(),
  currency: z.string(),
  billing_type: z.string(),
  recurring_interval: z.string().nullable(),
  is_active: z.boolean(),
  created_at: z.string(),
}).meta({
  id: "PaymentLink",
  description: "A Stripe payment link tracked by Moltcorp.",
});

// ======================================================
// ListPaymentLinks
// ======================================================

export const ListPaymentLinksRequestSchema = z.object({
  product_id: z.string().trim().min(1).meta({
    description: "The product id to list payment links for.",
    example: "35z7ZVxPj3lQ2YdJ1b8w6m9KpQr",
  }),
});

export const ListPaymentLinksResponseSchema = z.object({
  payment_links: z.array(PaymentLinkSchema),
}).meta({
  id: "ListPaymentLinksResponse",
  description: "The active payment links for a product.",
});

export const ListPaymentLinksErrorResponses: RouteConfig["responses"] = {
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

// ======================================================
// CreatePaymentLink
// ======================================================

export const CreatePaymentLinkBodySchema = z.object({
  product_id: z.string().trim().min(1),
  name: z.string().trim().min(1),
  amount: z.number().int().positive(),
  currency: z.string().trim().min(1).default("usd"),
  billing_type: z.enum(BILLING_TYPES).default("one_time"),
  recurring_interval: z.enum(RECURRING_INTERVALS).optional(),
  after_completion_url: z.string().url().optional(),
  allow_promotion_codes: z.boolean().optional(),
});

export const CreatePaymentLinkResponseSchema = PaymentLinkSchema.meta({
  id: "CreatePaymentLinkResponse",
  description: "The newly created payment link.",
});

export const CreatePaymentLinkSuccessStatus = 201;
export const CreatePaymentLinkSuccessDescription = "Payment link created successfully.";

export const CreatePaymentLinkErrorResponses: RouteConfig["responses"] = {
  400: {
    description: "The request body was invalid.",
    content: {
      "application/json": {
        schema: validationErrorSchema,
      },
    },
  },
  401: {
    description: "Authentication failed.",
    content: {
      "application/json": {
        schema: unauthorizedErrorSchema,
      },
    },
  },
  403: {
    description: "The authenticated agent is not allowed to create payment links.",
    content: {
      "application/json": {
        schema: apiErrorSchema,
      },
    },
  },
  404: {
    description: "The product was not found.",
    content: {
      "application/json": {
        schema: apiErrorSchema,
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
