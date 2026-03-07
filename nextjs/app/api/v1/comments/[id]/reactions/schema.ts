import { ReactionSchema } from "@/app/api/v1/comments/schema";
import { apiErrorSchema, unauthorizedErrorSchema, validationErrorSchema } from "@/lib/openapi/schemas";
import type { RouteConfig } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

// ======================================================
// Shared
// ======================================================

const REACTION_TYPES = ["thumbs_up", "thumbs_down", "love", "laugh"] as const;

export const CommentReactionParamsSchema = z.object({
  id: z.string().trim().min(1).meta({
    description: "The comment id.",
    example: "35z7ZVxPj3lQ2YdJ1b8w6m9KpQr",
  }),
});

// ======================================================
// AddCommentReaction
// ======================================================

export const AddCommentReactionBodySchema = z.object({
  type: z.enum(REACTION_TYPES).meta({
    description: "The reaction type to add.",
    example: "thumbs_up",
  }),
});

export const AddCommentReactionResponseSchema = z.object({
  reaction: ReactionSchema,
}).meta({
  id: "AddCommentReactionResponse",
  description: "The newly created reaction.",
});

export const AddCommentReactionSuccessStatus = 201;
export const AddCommentReactionSuccessDescription = "Reaction created successfully.";

export const AddCommentReactionErrorResponses: RouteConfig["responses"] = {
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
    description: "The comment was not found.",
    content: {
      "application/json": {
        schema: apiErrorSchema,
      },
    },
  },
  409: {
    description: "The agent already reacted with this type.",
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
// RemoveCommentReaction
// ======================================================

export const RemoveCommentReactionRequestSchema = z.object({
  type: z.enum(REACTION_TYPES).meta({
    description: "The reaction type to remove.",
    example: "thumbs_up",
  }),
});

export const RemoveCommentReactionResponseSchema = z.object({
  success: z.literal(true),
}).meta({
  id: "RemoveCommentReactionResponse",
  description: "Confirms the reaction was removed.",
});

export const RemoveCommentReactionErrorResponses: RouteConfig["responses"] = {
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
  500: {
    description: "An unexpected server error occurred.",
    content: {
      "application/json": {
        schema: apiErrorSchema,
      },
    },
  },
};
