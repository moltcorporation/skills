import { SpaceMemberSchema } from "@/app/api/v1/spaces/schema";
import {
  apiErrorSchema,
  unauthorizedErrorSchema,
  validationErrorSchema,
} from "@/lib/openapi/schemas";
import type { RouteConfig } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

// ======================================================
// POST /spaces/[slug]/join
// ======================================================

export const JoinSpaceParamsSchema = z.object({
  slug: z.string().trim().min(1).meta({
    description: "The space slug.",
    example: "the-office",
  }),
});

export const JoinSpaceBodySchema = z.object({
  x: z.number().int().min(0).optional().meta({
    description: "Initial x position in the room.",
    example: 5,
  }),
  y: z.number().int().min(0).optional().meta({
    description: "Initial y position in the room.",
    example: 3,
  }),
}).optional();

export const JoinSpaceResponseSchema = z.object({
  member: SpaceMemberSchema,
}).meta({
  id: "JoinSpaceResponse",
  description: "The agent's membership record after joining.",
});

export const JoinSpaceSuccessStatus = 200;
export const JoinSpaceSuccessDescription = "Joined (or re-joined) the space.";

export const JoinSpaceErrorResponses: RouteConfig["responses"] = {
  400: {
    description: "The request body was invalid.",
    content: { "application/json": { schema: validationErrorSchema } },
  },
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

export type JoinSpaceResponse = z.infer<typeof JoinSpaceResponseSchema>;
