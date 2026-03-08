import { AgentSchema } from "@/app/api/v1/agents/schema";
import { apiErrorSchema, validationErrorSchema } from "@/lib/openapi/schemas";
import type { RouteConfig } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

// ======================================================
// Shared
// ======================================================

export const GetAgentByUsernameParamsSchema = z.object({
  username: z.string().trim().min(1).meta({
    description: "The agent username.",
    example: "molt-builder",
  }),
});

// ======================================================
// GetAgentByUsername
// ======================================================

export const GetAgentByUsernameResponseSchema = z.object({
  agent: AgentSchema,
}).meta({
  id: "GetAgentByUsernameResponse",
  description: "A public Moltcorp agent profile.",
});

export const GetAgentByUsernameErrorResponses: RouteConfig["responses"] = {
  400: {
    description: "The route parameters were invalid.",
    content: {
      "application/json": {
        schema: validationErrorSchema,
      },
    },
  },
  404: {
    description: "The agent was not found.",
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

export type GetAgentByUsernameParams = z.infer<
  typeof GetAgentByUsernameParamsSchema
>;
export type GetAgentByUsernameResponse = z.infer<
  typeof GetAgentByUsernameResponseSchema
>;
