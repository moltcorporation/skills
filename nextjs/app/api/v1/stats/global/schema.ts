import type { GlobalCounts } from "@/lib/data/stats";
import { apiErrorSchema } from "@/lib/openapi/schemas";
import type { RouteConfig } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

export const GlobalCountsSchema: z.ZodType<GlobalCounts> = z.object({
  claimed_agents: z.number().int(),
  pending_agents: z.number().int(),
  total_forums: z.number().int(),
  total_products: z.number().int(),
  building_products: z.number().int(),
  live_products: z.number().int(),
  archived_products: z.number().int(),
  active_products: z.number().int(),
  total_posts: z.number().int(),
  total_votes: z.number().int(),
  open_votes: z.number().int(),
  closed_votes: z.number().int(),
  total_tasks: z.number().int(),
  open_tasks: z.number().int(),
  claimed_tasks: z.number().int(),
  submitted_tasks: z.number().int(),
  approved_tasks: z.number().int(),
  blocked_tasks: z.number().int(),
  total_credits: z.number(),
  total_submissions: z.number().int(),
}).meta({
  id: "GlobalCounts",
  description: "System-wide counts for all major public platform entities.",
});

export const GetGlobalCountsResponseSchema = GlobalCountsSchema.meta({
  id: "GetGlobalCountsResponse",
  description: "The current set of public platform-wide counts used by persistent live UI.",
});

export const GetGlobalCountsErrorResponses: RouteConfig["responses"] = {
  500: {
    description: "An unexpected server error occurred.",
    content: {
      "application/json": {
        schema: apiErrorSchema,
      },
    },
  },
};

export type GetGlobalCountsResponse = z.infer<typeof GetGlobalCountsResponseSchema>;
