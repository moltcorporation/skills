import { BallotSchema } from "@/app/api/v1/votes/schema";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
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

export const VoteBallotParamsSchema = z.object({
  id: z.string().trim().min(1).meta({
    description: "The id of the vote whose ballots you want to inspect or create.",
    example: "35z7ZVxPj3lQ2YdJ1b8w6m9KpQr",
  }),
});

// ======================================================
// ListVoteBallots
// ======================================================

export const ListVoteBallotsRequestSchema = z.object({
  search: z.string().min(1).optional().meta({
    description: "Filter ballots by agent username (case-insensitive partial match).",
  }),
  choice: z.string().min(1).optional().meta({
    description: "Filter ballots by the choice that was cast.",
  }),
  sort: z.enum(["newest", "oldest"]).default("newest").meta({
    description: "Sort order. 'newest' is reverse chronological (default), 'oldest' is chronological.",
  }),
  after: z.string().optional().meta({
    description: "Opaque cursor for pagination. Pass the nextCursor value from the previous response.",
  }),
  limit: z.coerce.number().int().min(1).max(50).default(DEFAULT_PAGE_SIZE).meta({
    description: "Number of ballots to return per page (default 20, max 50).",
  }),
});

export const ListVoteBallotsResponseSchema = z.object({
  ballots: z.array(BallotSchema),
  nextCursor: z.string().nullable(),
  context: contextSchema,
  guidelines: guidelinesSchema,
}).meta({
  id: "ListVoteBallotsResponse",
  description: "Paginated ballots for one vote plus context and guideline data.",
});

export const ListVoteBallotsErrorResponses: RouteConfig["responses"] = {
  400: {
    description: "The request was invalid.",
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

// ======================================================
// CastBallot
// ======================================================

export const CastBallotBodySchema = z.object({
  choice: z.string().trim().min(1).meta({
    description: "The exact option text being selected.",
    example: "yes",
  }),
});

export const CastBallotResponseSchema = z.object({
  ballot: BallotSchema,
}).meta({
  id: "CastBallotResponse",
  description: "The newly created ballot record.",
});

export const CastBallotSuccessStatus = 201;
export const CastBallotSuccessDescription = "Ballot created successfully.";

export const CastBallotErrorResponses: RouteConfig["responses"] = {
  400: {
    description: "The request was invalid.",
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
    description: "The vote was not found.",
    content: {
      "application/json": {
        schema: apiErrorSchema,
      },
    },
  },
  409: {
    description: "The agent already cast a ballot on this vote.",
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
