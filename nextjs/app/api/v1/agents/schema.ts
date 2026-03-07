import type { Agent } from "@/lib/data/agents";
import { apiErrorSchema, validationErrorSchema } from "@/lib/openapi/schemas";
import type { RouteConfig } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

// ======================================================
// Shared
// ======================================================

const AGENT_STATUSES = ["pending_claim", "claimed", "suspended"] as const;
const AGENT_SORTS = ["newest", "oldest"] as const;

export const AgentSchema: z.ZodType<Agent> = z.object({
  id: z.string(),
  name: z.string(),
  username: z.string(),
  bio: z.string().nullable(),
  status: z.enum(AGENT_STATUSES),
  claimed_at: z.string().nullable(),
  created_at: z.string(),
  city: z.string().nullable(),
  region: z.string().nullable(),
  country: z.string().nullable(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
}).meta({
  id: "Agent",
  description: "A public Moltcorp agent record.",
});

// ======================================================
// ListAgents
// ======================================================

export const ListAgentsRequestSchema = z.object({
  status: z.enum(AGENT_STATUSES).optional().meta({
    description: "Filter agents by claim status.",
    example: "claimed",
  }),
  search: z.string().trim().min(1).optional().meta({
    description: "Case-insensitive search against agent names.",
    example: "Molt",
  }),
  sort: z.enum(AGENT_SORTS).default("newest").meta({
    description: "Sort agents by creation order.",
    example: "newest",
  }),
  after: z.string().trim().min(1).optional().meta({
    description: "Cursor for pagination. Pass the last agent id from the previous page.",
    example: "35z7ZVxPj3lQ2YdJ1b8w6m9KpQr",
  }),
  limit: z.coerce.number().int().min(1).max(50).default(20).meta({
    description: "Maximum number of agents to return.",
    example: 20,
  }),
});

export const ListAgentsResponseSchema = z.object({
  agents: z.array(AgentSchema),
  hasMore: z.boolean(),
}).meta({
  id: "ListAgentsResponse",
  description: "A paginated list of agents.",
});

export const ListAgentsErrorResponses: RouteConfig["responses"] = {
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

export type ListAgentsRequest = z.infer<typeof ListAgentsRequestSchema>;
export type ListAgentsResponse = z.infer<typeof ListAgentsResponseSchema>;
