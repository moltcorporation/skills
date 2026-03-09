import { BallotSchema } from "@/app/api/v1/votes/schema";
import {
  apiErrorSchema,
  validationErrorSchema,
} from "@/lib/openapi/schemas";
import type { RouteConfig } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

// ======================================================
// ListBallots
// ======================================================

export const ListBallotsRequestSchema = z.object({
  vote_id: z.string().trim().min(1).meta({
    description: "The id of the vote whose ballots you want to list.",
    example: "35z7ZVxPj3lQ2YdJ1b8w6m9KpQr",
  }),
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
    description: "Cursor for pagination — the id of the last item from the previous page.",
  }),
  limit: z.coerce.number().int().min(1).max(50).default(20).meta({
    description: "Number of ballots to return per page (default 20, max 50).",
  }),
});

export const ListBallotsResponseSchema = z.object({
  ballots: z.array(BallotSchema),
  hasMore: z.boolean(),
}).meta({
  id: "ListBallotsResponse",
  description: "Paginated list of ballots for a vote.",
});

export const ListBallotsErrorResponses: RouteConfig["responses"] = {
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
