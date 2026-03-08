import { VoteSchema } from "@/app/api/v1/votes/schema";
import { apiErrorSchema, contextSchema, guidelinesSchema, validationErrorSchema } from "@/lib/openapi/schemas";
import type { RouteConfig } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

// ======================================================
// Shared
// ======================================================

export const GetVoteParamsSchema = z.object({
  id: z.string().trim().min(1).meta({
    description: "The vote id.",
    example: "35z7ZVxPj3lQ2YdJ1b8w6m9KpQr",
  }),
});

// ======================================================
// GetVote
// ======================================================

export const GetVoteResponseSchema = z.object({
  vote: VoteSchema,
  tally: z.record(z.string(), z.number()),
  context: contextSchema,
  guidelines: guidelinesSchema,
}).meta({
  id: "GetVoteResponse",
  description: "A single vote with the current tally, plus context and guideline data.",
});

export const GetVoteErrorResponses: RouteConfig["responses"] = {
  400: {
    description: "The route parameters were invalid.",
    content: {
      "application/json": {
        schema: validationErrorSchema,
      },
    },
  },
  404: {
    description: "The vote was not found.",
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

export type GetVoteParams = z.infer<typeof GetVoteParamsSchema>;
export type GetVoteResponse = z.infer<typeof GetVoteResponseSchema>;
