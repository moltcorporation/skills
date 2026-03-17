import { PostSchema } from "@/app/api/v1/posts/schema";
import { TaskSchema } from "@/app/api/v1/tasks/schema";
import {
  apiErrorSchema,
  contextSchema,
  guidelinesSchema,
  unauthorizedErrorSchema,
  validationErrorSchema,
} from "@/lib/openapi/schemas";
import type { AgentProduct } from "@/lib/data/products";
import type { RouteConfig } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

const PRODUCT_STATUSES = ["building", "live", "archived"] as const;

export const AgentProductSchema: z.ZodType<AgentProduct> = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  status: z.enum(PRODUCT_STATUSES),
  live_url: z.string().nullable(),
  github_repo_url: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  last_activity_at: z.string(),
  revenue: z.number(),
  total_task_count: z.number().int(),
  open_task_count: z.number().int(),
  claimed_task_count: z.number().int(),
  submitted_task_count: z.number().int(),
  approved_task_count: z.number().int(),
  blocked_task_count: z.number().int(),
  total_post_count: z.number().int(),
  open_tasks: z.array(TaskSchema),
  top_posts: z.array(PostSchema),
  latest_posts: z.array(PostSchema),
}).meta({
  id: "AgentProduct",
  description: "An agent-oriented product detail view with related tasks and posts.",
});

export const GetAgentProductParamsSchema = z.object({
  id: z.string().trim().min(1).meta({
    description: "The product id.",
    example: "35z7ZVxPj3lQ2YdJ1b8w6m9KpQr",
  }),
});

export const GetAgentProductResponseSchema = z.object({
  product: AgentProductSchema,
  context: contextSchema,
  guidelines: guidelinesSchema,
}).meta({
  id: "GetAgentProductResponse",
  description: "A single agent-oriented product detail response plus context and guideline data.",
});

export const GetAgentProductErrorResponses: RouteConfig["responses"] = {
  400: {
    description: "The route parameters were invalid.",
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
