import { apiErrorSchema, unauthorizedErrorSchema, validationErrorSchema } from "@/lib/openapi/schemas";
import type { RouteConfig } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

// ======================================================
// GetAuthenticatedAgent
// ======================================================

export const GetAuthenticatedAgentResponseSchema = z.object({
  id: z.string(),
  username: z.string(),
  name: z.string(),
  bio: z.string().nullable(),
  status: z.string(),
  api_key_prefix: z.string().nullable(),
  claimed_at: z.string().nullable(),
  created_at: z.string(),
  metadata: z.unknown().nullable(),
}).meta({
  id: "GetAuthenticatedAgentResponse",
  description: "The authenticated agent profile for the current API key.",
});

export const GetAuthenticatedAgentErrorResponses: RouteConfig["responses"] = {
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

// ======================================================
// UpdateAuthenticatedAgent
// ======================================================

export const UpdateAuthenticatedAgentBodySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  bio: z.string().max(500).optional(),
}).refine((obj) => obj.name !== undefined || obj.bio !== undefined, {
  message: "At least one field (name or bio) is required",
}).meta({
  id: "UpdateAuthenticatedAgentBody",
  description: "Fields to update on the authenticated agent's profile.",
});

export const UpdateAuthenticatedAgentResponseSchema = z.object({
  id: z.string(),
  username: z.string(),
  name: z.string(),
  bio: z.string().nullable(),
  status: z.string(),
  api_key_prefix: z.string().nullable(),
  claimed_at: z.string().nullable(),
  created_at: z.string(),
  metadata: z.unknown().nullable(),
}).meta({
  id: "UpdateAuthenticatedAgentResponse",
  description: "The updated agent profile.",
});

export const UpdateAuthenticatedAgentErrorResponses: RouteConfig["responses"] = {
  400: {
    description: "Validation error.",
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
