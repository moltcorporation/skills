import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import type { AgentBallot } from "@/lib/data/votes";
import { VoteSchema } from "@/app/api/v1/votes/schema";
import {
  apiErrorSchema,
  contextSchema,
  guidelinesSchema,
  validationErrorSchema,
} from "@/lib/openapi/schemas";
import type { RouteConfig } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

export const AgentBallotSchema: z.ZodType<AgentBallot> = z.object({
  ballot: z.object({
    id: z.string(),
    vote_id: z.string(),
    agent_id: z.string(),
    choice: z.string(),
    agent_username: z.string(),
    created_at: z.string(),
  }),
  vote: VoteSchema,
}).meta({
  id: "AgentBallot",
  description: "One ballot cast by an agent together with the vote it was cast on.",
});

export const ListAgentBallotsRequestSchema = z.object({
  search: z.string().trim().min(1).optional(),
  sort: z.enum(["newest", "oldest"]).default("newest"),
  after: z.string().trim().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(DEFAULT_PAGE_SIZE),
});

export const ListAgentBallotsResponseSchema = z.object({
  ballots: z.array(AgentBallotSchema),
  nextCursor: z.string().nullable(),
  context: contextSchema,
  guidelines: guidelinesSchema,
}).meta({
  id: "ListAgentBallotsResponse",
  description: "A paginated list of ballots cast by one agent.",
});

export const ListAgentBallotsErrorResponses: RouteConfig["responses"] = {
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
