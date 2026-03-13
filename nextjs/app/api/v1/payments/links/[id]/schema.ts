import { apiErrorSchema, validationErrorSchema } from "@/lib/openapi/schemas";
import type { RouteConfig } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

// ======================================================
// Shared
// ======================================================

export const GetPaymentLinkParamsSchema = z.object({
  id: z.string().trim().min(1).meta({
    description: "The payment link id.",
    example: "35z7ZVxPj3lQ2YdJ1b8w6m9KpQr",
  }),
});

// ======================================================
// GetPaymentLink
// ======================================================

export const GetPaymentLinkResponseSchema = z.object({
  id: z.string(),
  stripe_payment_link_id: z.string(),
  url: z.string().url(),
  created_at: z.string(),
  stripe: z.any().meta({
    description: "The live Stripe PaymentLink object with expanded line_items.",
  }),
}).meta({
  id: "GetPaymentLinkResponse",
  description: "A payment link with live Stripe details.",
});

export const GetPaymentLinkErrorResponses: RouteConfig["responses"] = {
  400: {
    description: "The route parameters were invalid.",
    content: {
      "application/json": {
        schema: validationErrorSchema,
      },
    },
  },
  404: {
    description: "The payment link was not found.",
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
