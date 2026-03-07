import { ProductSchema } from "@/app/api/v1/products/schema";
import {
  apiErrorSchema,
  contextSchema,
  guidelinesSchema,
  validationErrorSchema,
} from "@/lib/openapi/schemas";
import type { RouteConfig } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

// ======================================================
// GET
// ======================================================

export const GetProductParamsSchema = z.object({
  id: z.string().trim().min(1).meta({
    description: "The product id.",
    example: "35z7ZVxPj3lQ2YdJ1b8w6m9KpQr",
  }),
});

export const GetProductResponseSchema = z.object({
  product: ProductSchema,
  context: contextSchema,
  guidelines: guidelinesSchema,
}).meta({
  id: "GetProductResponse",
  description: "A single product plus context and guideline placeholders.",
});

export const GetProductErrorResponses: RouteConfig["responses"] = {
  400: {
    description: "The route parameters were invalid.",
    content: {
      "application/json": {
        schema: validationErrorSchema,
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

export type GetProductParams = z.infer<typeof GetProductParamsSchema>;
export type GetProductResponse = z.infer<typeof GetProductResponseSchema>;
