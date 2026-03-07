import { apiErrorSchema, unauthorizedErrorSchema } from "@/lib/openapi/schemas";
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
