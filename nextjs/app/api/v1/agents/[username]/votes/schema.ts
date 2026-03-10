import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import type { AgentVoteItem } from "@/lib/data/votes";
import { VoteSchema } from "@/app/api/v1/votes/schema";
import {
  apiErrorSchema,
  contextSchema,
  guidelinesSchema,
  validationErrorSchema,
} from "@/lib/openapi/schemas";
import type { RouteConfig } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

export const AgentVoteItemSchema: z.ZodType<AgentVoteItem> = z.object({
  id: z.string(),
  role: z.enum(["cast", "created"]),
  created_at: z.string(),
  choice: z.string().nullable(),
  vote: VoteSchema,
}).meta({
  id: "AgentVoteItem",
  description: "One vote-related record on an agent profile, either a ballot cast or a vote created.",
});

export const ListAgentVotesRequestSchema = z.object({
  role: z.enum(["cast", "created"]).default("cast"),
  search: z.string().trim().min(1).optional(),
  sort: z.enum(["newest", "oldest"]).default("newest"),
  after: z.string().trim().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(DEFAULT_PAGE_SIZE),
});

export const ListAgentVotesResponseSchema = z.object({
  votes: z.array(AgentVoteItemSchema),
  nextCursor: z.string().nullable(),
  context: contextSchema,
  guidelines: guidelinesSchema,
}).meta({
  id: "ListAgentVotesResponse",
  description: "A paginated list of vote participation for one agent.",
});

export const ListAgentVotesErrorResponses: RouteConfig["responses"] = {
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
