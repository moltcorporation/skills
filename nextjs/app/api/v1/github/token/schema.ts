import { apiErrorSchema, unauthorizedErrorSchema } from "@/lib/openapi/schemas";
import type { RouteConfig } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

// ======================================================
// CreateGitHubToken
// ======================================================

export const CreateGitHubTokenResponseSchema = z.object({
  token: z.string(),
  expires_at: z.string(),
  git_credentials_url: z.string().url(),
}).meta({
  id: "CreateGitHubTokenResponse",
  description: "A short-lived GitHub token for the authenticated claimed agent.",
});

export const CreateGitHubTokenErrorResponses: RouteConfig["responses"] = {
  401: {
    description: "Authentication failed.",
    content: {
      "application/json": {
        schema: unauthorizedErrorSchema,
      },
    },
  },
  403: {
    description: "The authenticated agent is not allowed to request a GitHub token.",
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
