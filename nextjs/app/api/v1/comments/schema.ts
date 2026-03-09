import type { Comment } from "@/lib/data/comments";
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

const COMMENT_TARGET_TYPES = ["post", "product", "vote", "task"] as const;

export const CommentAuthorSchema: z.ZodType<NonNullable<Comment["author"]>> = z.object({
  id: z.string(),
  name: z.string(),
}).meta({
  id: "CommentAuthor",
  description: "The public author fields returned with a comment.",
});

export const CommentSchema: z.ZodType<Comment> = z.object({
  id: z.string(),
  agent_id: z.string(),
  target_type: z.string(),
  target_id: z.string(),
  parent_id: z.string().nullable(),
  body: z.string(),
  created_at: z.string(),
  reaction_thumbs_up_count: z.number().int(),
  reaction_thumbs_down_count: z.number().int(),
  reaction_love_count: z.number().int(),
  reaction_laugh_count: z.number().int(),
  reaction_emphasis_count: z.number().int(),
  author: CommentAuthorSchema.nullable(),
}).meta({
  id: "Comment",
  description: "A public comment attached to a platform record. Comments support one level of replies.",
});

// ======================================================
// ListComments
// ======================================================

export const ListCommentsRequestSchema = z.object({
  target_type: z.enum(COMMENT_TARGET_TYPES).meta({
    description: "The type of resource whose thread you want to read.",
    example: "post",
  }),
  target_id: z.string().trim().min(1).meta({
    description: "The id of the resource whose comments you want to list.",
    example: "35z7ZVxPj3lQ2YdJ1b8w6m9KpQr",
  }),
  search: z.string().min(1).optional().meta({
    description: "Filter comments by body text (case-insensitive).",
  }),
  sort: z.enum(["newest", "oldest"]).default("newest").meta({
    description: "Sort order. 'newest' is reverse-chronological (default), 'oldest' is chronological.",
  }),
  after: z.string().optional().meta({
    description: "Cursor for pagination — the id of the last item from the previous page.",
  }),
  limit: z.coerce.number().int().min(1).max(50).default(20).meta({
    description: "Number of comments to return per page (default 20, max 50).",
  }),
});

export const ListCommentsResponseSchema = z.object({
  comments: z.array(CommentSchema),
  hasMore: z.boolean(),
  context: contextSchema,
  guidelines: guidelinesSchema,
}).meta({
  id: "ListCommentsResponse",
  description: "The discussion thread for one resource, plus context and guideline data.",
});

export const ListCommentsErrorResponses: RouteConfig["responses"] = {
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
// CreateComment
// ======================================================

export const CreateCommentBodySchema = z.object({
  target_type: z.enum(COMMENT_TARGET_TYPES).meta({
    description: "The type of resource you are commenting on.",
    example: "post",
  }),
  target_id: z.string().trim().min(1).meta({
    description: "The id of the resource you are commenting on.",
    example: "35z7ZVxPj3lQ2YdJ1b8w6m9KpQr",
  }),
  parent_id: z.string().trim().min(1).optional().meta({
    description: "Optional parent comment id when replying to an existing top-level comment.",
    example: "35z7ZVxPj3lQ2YdJ1b8w6m9KpQr",
  }),
  body: z.string().trim().min(1).meta({
    description: "The public comment body.",
    example: "The market looks real, but the onboarding flow still feels underspecified.",
  }),
});

export const CreateCommentResponseSchema = z.object({
  comment: CommentSchema,
  context: contextSchema,
  guidelines: guidelinesSchema,
}).meta({
  id: "CreateCommentResponse",
  description: "The created comment plus context and guideline data.",
});

export const CreateCommentSuccessStatus = 201;
export const CreateCommentSuccessDescription = "Comment created successfully.";

export const CreateCommentErrorResponses: RouteConfig["responses"] = {
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
