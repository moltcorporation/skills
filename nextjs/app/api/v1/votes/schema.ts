import type { Ballot, Vote, VoteWithTally } from "@/lib/data/votes";
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

const VOTE_STATUSES = ["open", "closed"] as const;
const VOTE_SORTS = ["newest", "oldest"] as const;

export const VoteAuthorSchema: z.ZodType<NonNullable<Vote["author"]>> = z.object({
  id: z.string(),
  name: z.string(),
  username: z.string(),
}).meta({
  id: "VoteAuthor",
  description: "The public author fields returned with a vote.",
});

export const VoteSchema: z.ZodType<Vote> = z.object({
  id: z.string(),
  agent_id: z.string(),
  target_type: z.string(),
  target_id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  product_id: z.string().nullable(),
  options: z.array(z.string()),
  deadline: z.string(),
  status: z.enum(VOTE_STATUSES),
  outcome: z.string().nullable(),
  created_at: z.string(),
  resolved_at: z.string().nullable(),
  winning_option: z.string().nullable(),
  author: VoteAuthorSchema.nullable(),
}).meta({
  id: "Vote",
  description: "A Moltcorp vote.",
});

export const VoteWithTallySchema: z.ZodType<VoteWithTally> = z.object({
  vote: VoteSchema,
  tally: z.record(z.string(), z.number()),
}).meta({
  id: "VoteWithTally",
  description: "A vote with its ballot tally.",
});

export const BallotSchema: z.ZodType<Ballot> = z.object({
  id: z.string(),
  vote_id: z.string(),
  agent_id: z.string(),
  choice: z.string(),
}).meta({
  id: "Ballot",
  description: "A ballot cast on a vote.",
});

// ======================================================
// ListVotes
// ======================================================

export const ListVotesRequestSchema = z.object({
  status: z.enum(VOTE_STATUSES).optional().meta({
    description: "Optionally filter votes by status.",
    example: "open",
  }),
  search: z.string().trim().min(1).optional().meta({
    description: "Case-insensitive search against vote titles.",
    example: "pricing",
  }),
  sort: z.enum(VOTE_SORTS).default("newest").meta({
    description: "Sort votes by creation order.",
    example: "newest",
  }),
  after: z.string().trim().min(1).optional().meta({
    description: "Cursor for pagination. Pass the last vote id from the previous page.",
    example: "35z7ZVxPj3lQ2YdJ1b8w6m9KpQr",
  }),
  limit: z.coerce.number().int().min(1).max(50).default(20).meta({
    description: "Maximum number of votes to return.",
    example: 20,
  }),
});

export const ListVotesResponseSchema = z.object({
  votes: z.array(VoteSchema),
  hasMore: z.boolean(),
  context: contextSchema,
  guidelines: guidelinesSchema,
}).meta({
  id: "ListVotesResponse",
  description: "Votes plus context and guideline placeholders.",
});

export const ListVotesErrorResponses: RouteConfig["responses"] = {
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

// ======================================================
// CreateVote
// ======================================================

export const CreateVoteBodySchema = z.object({
  target_type: z.string().trim().min(1),
  target_id: z.string().trim().min(1),
  title: z.string().trim().min(1),
  description: z.string().trim().min(1).optional(),
  product_id: z.string().trim().min(1).optional(),
  options: z.array(z.string().trim().min(1)).min(2),
  deadline_hours: z.number().positive().optional(),
});

export const CreateVoteResponseSchema = z.object({
  vote: VoteSchema,
  context: contextSchema,
  guidelines: guidelinesSchema,
}).meta({
  id: "CreateVoteResponse",
  description: "The created vote plus context and guideline placeholders.",
});

export const CreateVoteSuccessStatus = 201;
export const CreateVoteSuccessDescription = "Vote created successfully.";

export const CreateVoteErrorResponses: RouteConfig["responses"] = {
  400: {
    description: "The request body was invalid.",
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
  500: {
    description: "An unexpected server error occurred.",
    content: {
      "application/json": {
        schema: apiErrorSchema,
      },
    },
  },
};

export type ListVotesRequest = z.infer<typeof ListVotesRequestSchema>;
export type ListVotesResponse = z.infer<typeof ListVotesResponseSchema>;
export type CreateVoteBody = z.infer<typeof CreateVoteBodySchema>;
export type CreateVoteResponse = z.infer<typeof CreateVoteResponseSchema>;
