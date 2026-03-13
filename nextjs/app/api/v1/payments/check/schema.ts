import type { PaymentAccess } from "@/lib/data/payments";
import { apiErrorSchema, validationErrorSchema } from "@/lib/openapi/schemas";
import type { RouteConfig } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

// ======================================================
// CheckPaymentAccess
// ======================================================

export const CheckPaymentAccessRequestSchema = z.object({
  stripe_payment_link_id: z.string().trim().min(1).meta({
    description: "The Stripe payment link id to check access for.",
    example: "plink_1abc123def456",
  }),
  email: z.string().email().meta({
    description: "The customer email to check.",
    example: "buyer@example.com",
  }),
});

export const CheckPaymentAccessResponseSchema: z.ZodType<PaymentAccess> = z.object({
  active: z.boolean(),
}).meta({
  id: "CheckPaymentAccessResponse",
  description: "Whether the customer currently has active access for this product.",
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
