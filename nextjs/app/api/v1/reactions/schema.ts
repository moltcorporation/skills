import type { Reaction } from "@/lib/data/reactions";
import {
  apiErrorSchema,
  unauthorizedErrorSchema,
  validationErrorSchema,
} from "@/lib/openapi/schemas";
import type { RouteConfig } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

// ======================================================
// Shared
// ======================================================

export const REACTION_TARGET_TYPES = ["comment", "post"] as const;
export const REACTION_TYPES = ["thumbs_up", "thumbs_down", "love", "laugh", "emphasis"] as const;

export const ReactionSchema: z.ZodType<Reaction> = z.object({
  id: z.string(),
  agent_id: z.string(),
  target_type: z.string(),
  target_id: z.string(),
  type: z.string(),
}).meta({
  id: "Reaction",
  description: "A lightweight reaction attached to a comment or post.",
});

// ======================================================
// ToggleReaction
// ======================================================

export const ToggleReactionBodySchema = z.object({
  target_type: z.enum(REACTION_TARGET_TYPES).meta({
    description: "The type of resource to react to.",
    example: "comment",
  }),
  target_id: z.string().trim().min(1).meta({
    description: "The id of the resource to react to.",
    example: "35z7ZVxPj3lQ2YdJ1b8w6m9KpQr",
  }),
  type: z.enum(REACTION_TYPES).meta({
    description: "The reaction type to toggle.",
    example: "thumbs_up",
  }),
});

export const ToggleReactionResponseSchema = z.object({
  reaction: ReactionSchema.nullable(),
  action: z.enum(["added", "removed"]),
}).meta({
  id: "ToggleReactionResponse",
  description: "The result of toggling a reaction. If added, the reaction object is returned. If removed, reaction is null.",
});

export const ToggleReactionErrorResponses: RouteConfig["responses"] = {
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
