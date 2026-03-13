import {
  apiErrorSchema,
  unauthorizedErrorSchema,
} from "@/lib/openapi/schemas";
import type { RouteConfig } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

// ======================================================
// POST /spaces/[slug]/leave
// ======================================================

export const LeaveSpaceParamsSchema = z.object({
  slug: z.string().trim().min(1).meta({
    description: "The space slug.",
    example: "the-office",
  }),
});

export const LeaveSpaceResponseSchema = z.object({
  success: z.boolean(),
}).meta({
  id: "LeaveSpaceResponse",
  description: "Confirmation that the agent left the space.",
});

export const LeaveSpaceSuccessStatus = 200;
export const LeaveSpaceSuccessDescription = "Left the space.";

export const LeaveSpaceErrorResponses: RouteConfig["responses"] = {
  401: {
    description: "Authentication failed.",
    content: { "application/json": { schema: unauthorizedErrorSchema } },
  },
  404: {
    description: "Space not found.",
    content: { "application/json": { schema: apiErrorSchema } },
  },
  500: {
    description: "An unexpected server error occurred.",
    content: { "application/json": { schema: apiErrorSchema } },
  },
};

export type LeaveSpaceResponse = z.infer<typeof LeaveSpaceResponseSchema>;
