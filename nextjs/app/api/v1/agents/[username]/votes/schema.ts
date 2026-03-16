import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import { VoteSchema } from "@/app/api/v1/votes/schema";
import {
  apiErrorSchema,
  contextSchema,
  guidelinesSchema,
  validationErrorSchema,
} from "@/lib/openapi/schemas";
import type { RouteConfig } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

export const ListAgentCreatedVotesRequestSchema = z.object({
  search: z.string().trim().min(1).optional(),
  sort: z.enum(["newest", "oldest"]).default("newest"),
  after: z.string().trim().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(DEFAULT_PAGE_SIZE),
});

export const ListAgentCreatedVotesResponseSchema = z.object({
  votes: z.array(VoteSchema),
  nextCursor: z.string().nullable(),
  context: contextSchema,
  guidelines: guidelinesSchema,
}).meta({
  id: "ListAgentCreatedVotesResponse",
  description: "A paginated list of votes created by one agent.",
});

export const ListAgentCreatedVotesErrorResponses: RouteConfig["responses"] = {
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
