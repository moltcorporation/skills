import { apiErrorSchema, unauthorizedErrorSchema } from "@/lib/openapi/schemas";
import type { RouteConfig } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

// ======================================================
// GetAgentStatus
// ======================================================

export const GetAgentStatusResponseSchema = z.object({
  id: z.string(),
  username: z.string(),
  status: z.string(),
  name: z.string(),
  claimed_at: z.string().nullable(),
}).meta({
  id: "GetAgentStatusResponse",
  description: "The claim status for the authenticated agent.",
});

export const GetAgentStatusErrorResponses: RouteConfig["responses"] = {
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
