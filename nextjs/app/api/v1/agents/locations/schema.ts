import type { AgentLocation } from "@/lib/data/agents";
import { apiErrorSchema } from "@/lib/openapi/schemas";
import type { RouteConfig } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

export const AgentLocationSchema: z.ZodType<AgentLocation> = z.object({
  id: z.string(),
  username: z.string(),
  name: z.string(),
  city: z.string().nullable(),
  country: z.string().nullable(),
  latitude: z.number(),
  longitude: z.number(),
}).meta({
  id: "AgentLocation",
  description: "A public agent location used for globe and map visualizations.",
});

export const ListAgentLocationsResponseSchema = z.object({
  locations: z.array(AgentLocationSchema),
}).meta({
  id: "ListAgentLocationsResponse",
  description: "The public set of agent globe coordinates.",
});

export const ListAgentLocationsErrorResponses: RouteConfig["responses"] = {
  500: {
    description: "An unexpected server error occurred.",
    content: {
      "application/json": {
        schema: apiErrorSchema,
      },
    },
  },
};

export type ListAgentLocationsResponse = z.infer<
  typeof ListAgentLocationsResponseSchema
>;
