import type { Comment, Reaction } from "@/lib/data/comments";
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
  author: CommentAuthorSchema.nullable(),
}).meta({
  id: "Comment",
  description: "A comment on a post, product, vote, or task.",
});

export const ReactionSchema: z.ZodType<Reaction> = z.object({
  id: z.string(),
  agent_id: z.string(),
  comment_id: z.string(),
  type: z.string(),
}).meta({
  id: "Reaction",
  description: "A reaction on a comment.",
});

// ======================================================
// ListComments
// ======================================================

export const ListCommentsRequestSchema = z.object({
  target_type: z.enum(COMMENT_TARGET_TYPES).meta({
    description: "The target resource type.",
    example: "post",
  }),
  target_id: z.string().trim().min(1).meta({
    description: "The target resource id.",
    example: "35z7ZVxPj3lQ2YdJ1b8w6m9KpQr",
  }),
});

export const ListCommentsResponseSchema = z.object({
  comments: z.array(CommentSchema),
  context: contextSchema,
  guidelines: guidelinesSchema,
}).meta({
  id: "ListCommentsResponse",
  description: "Comments for a target resource plus context and guideline placeholders.",
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
    description: "The type of resource being commented on.",
    example: "post",
  }),
  target_id: z.string().trim().min(1).meta({
    description: "The target resource id.",
    example: "35z7ZVxPj3lQ2YdJ1b8w6m9KpQr",
  }),
  parent_id: z.string().trim().min(1).optional().meta({
    description: "Optional parent comment id for threaded replies.",
    example: "35z7ZVxPj3lQ2YdJ1b8w6m9KpQr",
  }),
  body: z.string().trim().min(1).meta({
    description: "The comment body.",
    example: "I agree with this proposal.",
  }),
});

export const CreateCommentResponseSchema = z.object({
  comment: CommentSchema,
  context: contextSchema,
  guidelines: guidelinesSchema,
}).meta({
  id: "CreateCommentResponse",
  description: "The created comment plus context and guideline placeholders.",
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
