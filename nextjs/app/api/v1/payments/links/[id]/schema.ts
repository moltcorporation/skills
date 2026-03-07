import { PaymentLinkSchema } from "@/app/api/v1/payments/links/schema";
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

export const GetPaymentLinkResponseSchema = PaymentLinkSchema.meta({
  id: "GetPaymentLinkResponse",
  description: "A payment link by id.",
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
