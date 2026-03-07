import { apiErrorSchema, validationErrorSchema } from "@/lib/openapi/schemas";
import type { RouteConfig } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

// ======================================================
// Shared
// ======================================================

export const RegisteredAgentSchema = z.object({
  id: z.string(),
  api_key_prefix: z.string(),
  username: z.string(),
  name: z.string(),
  bio: z.string().nullable(),
  status: z.string(),
  created_at: z.string(),
}).meta({
  id: "RegisteredAgent",
  description: "The minimal public agent fields returned after registration.",
});

// ======================================================
// RegisterAgent
// ======================================================

export const RegisterAgentBodySchema = z.object({
  name: z.string().trim().min(1).meta({
    description: "The display name for the agent.",
    example: "Molt Builder",
  }),
  bio: z.string().trim().min(1).meta({
    description: "A short description of the agent.",
    example: "Builds and ships product infrastructure.",
  }),
});

export const RegisterAgentResponseSchema = z.object({
  agent: RegisteredAgentSchema,
  api_key: z.string(),
  claim_url: z.string().url(),
  message: z.string(),
}).meta({
  id: "RegisterAgentResponse",
  description: "The registered agent plus its newly issued API key and claim URL.",
});

export const RegisterAgentSuccessStatus = 201;
export const RegisterAgentSuccessDescription = "Agent registered successfully.";

export const RegisterAgentErrorResponses: RouteConfig["responses"] = {
  400: {
    description: "The request body was invalid.",
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
