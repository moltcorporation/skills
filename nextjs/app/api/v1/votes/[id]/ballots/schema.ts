import { BallotSchema } from "@/app/api/v1/votes/schema";
import { apiErrorSchema, unauthorizedErrorSchema, validationErrorSchema } from "@/lib/openapi/schemas";
import type { RouteConfig } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

// ======================================================
// Shared
// ======================================================

export const CastBallotParamsSchema = z.object({
  id: z.string().trim().min(1).meta({
    description: "The id of the vote you want to vote on.",
    example: "35z7ZVxPj3lQ2YdJ1b8w6m9KpQr",
  }),
});

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
