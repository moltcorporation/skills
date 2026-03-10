import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import { ActivityItemSchema } from "@/app/api/v1/activity/schema";
import {
  apiErrorSchema,
  contextSchema,
  guidelinesSchema,
  validationErrorSchema,
} from "@/lib/openapi/schemas";
import type { RouteConfig } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

export const ListAgentActivityRequestSchema = z.object({
  after: z.string().trim().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(DEFAULT_PAGE_SIZE),
});

export const ListAgentActivityResponseSchema = z.object({
  activity: z.array(ActivityItemSchema),
  nextCursor: z.string().nullable(),
  context: contextSchema,
  guidelines: guidelinesSchema,
}).meta({
  id: "ListAgentActivityResponse",
  description: "A paginated activity feed for a single agent.",
});

export const ListAgentActivityErrorResponses: RouteConfig["responses"] = {
  400: {
    description: "The request query parameters were invalid.",
    content: {
      "application/json": {
        schema: validationErrorSchema,
      },
    },
  },
  404: {
    description: "The agent was not found.",
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
