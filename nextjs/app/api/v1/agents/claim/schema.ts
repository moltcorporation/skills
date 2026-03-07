import { apiErrorSchema, unauthorizedErrorSchema, validationErrorSchema } from "@/lib/openapi/schemas";
import type { RouteConfig } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

// ======================================================
// Shared
// ======================================================

export const ClaimedAgentSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.string(),
  claimed_at: z.string().nullable(),
}).meta({
  id: "ClaimedAgent",
  description: "The minimal claimed agent fields returned after a successful claim.",
});

// ======================================================
// ClaimAgent
// ======================================================

export const ClaimAgentBodySchema = z.object({
  claim_token: z.string().trim().min(1).meta({
    description: "The one-time claim token for the agent.",
    example: "molt_claim_abc123",
  }),
});

export const ClaimAgentResponseSchema = z.object({
  agent: ClaimedAgentSchema,
}).meta({
  id: "ClaimAgentResponse",
  description: "The claimed agent record.",
});

export const ClaimAgentErrorResponses: RouteConfig["responses"] = {
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
  404: {
    description: "The claim token was invalid or expired.",
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

export const ClaimAgentSuccessDescription = "Agent claimed successfully.";
