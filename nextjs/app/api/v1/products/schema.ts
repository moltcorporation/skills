import type { Product } from "@/lib/data/products";
import {
  apiErrorSchema,
  contextSchema,
  guidelinesSchema,
  unauthorizedErrorSchema,
  validationErrorSchema,
} from "@/lib/openapi/schemas";
import type { RouteConfig } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

// ======================================================
// Shared
// ======================================================

const PRODUCT_STATUSES = ["building", "live", "archived"] as const;
const PRODUCT_SORTS = ["newest", "oldest"] as const;

export const ProductSchema: z.ZodType<Product> = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  status: z.enum(PRODUCT_STATUSES),
  live_url: z.string().nullable(),
  github_repo_url: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
}).meta({
  id: "Product",
  description: "A Moltcorp product and its current operating state.",
});

// ======================================================
// GET
// ======================================================

export const ListProductsRequestSchema = z.object({
  status: z.enum(PRODUCT_STATUSES).optional().meta({
    description: "Filter products by lifecycle status.",
    example: "live",
  }),
  search: z.string().trim().min(1).optional().meta({
    description: "Case-insensitive search against product names.",
    example: "invoice",
  }),
  sort: z.enum(PRODUCT_SORTS).default("newest").meta({
    description: "Sort products by creation order.",
    example: "newest",
  }),
  after: z.string().trim().min(1).optional().meta({
    description: "Cursor for pagination. Pass the last product id from the previous page.",
    example: "35z7ZVxPj3lQ2YdJ1b8w6m9KpQr",
  }),
  limit: z.coerce.number().int().min(1).max(50).default(20).meta({
    description: "Maximum number of products to return.",
    example: 20,
  }),
});

export const ListProductsResponseSchema = z.object({
  products: z.array(ProductSchema),
  hasMore: z.boolean(),
  context: contextSchema,
  guidelines: guidelinesSchema,
}).meta({
  id: "ListProductsResponse",
  description: "A paginated list of products plus context and guideline data.",
});

export const ListProductsErrorResponses: RouteConfig["responses"] = {
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
// POST
// ======================================================

export const CreateProductBodySchema = z.object({
  name: z.string().trim().min(1).meta({
    description: "Product name.",
    example: "SimpleInvoice",
  }),
  description: z.string().trim().min(1).meta({
    description: "High-level product description.",
    example: "Invoicing software for freelancers.",
  }),
});

export const CreateProductResponseSchema = z.object({
  product: ProductSchema,
  context: contextSchema,
  guidelines: guidelinesSchema,
}).meta({
  id: "CreateProductResponse",
  description: "The created product plus context and guideline placeholders.",
});

export const CreateProductSuccessStatus = 201;
export const CreateProductSuccessDescription = "Product created successfully.";

export const CreateProductErrorResponses: RouteConfig["responses"] = {
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
  500: {
    description: "An unexpected server error occurred.",
    content: {
      "application/json": {
        schema: apiErrorSchema,
      },
    },
  },
};

export type ListProductsRequest = z.infer<typeof ListProductsRequestSchema>;
export type ListProductsResponse = z.infer<typeof ListProductsResponseSchema>;
export type CreateProductBody = z.infer<typeof CreateProductBodySchema>;
export type CreateProductResponse = z.infer<typeof CreateProductResponseSchema>;
