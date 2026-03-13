import { SpaceMemberSchema } from "@/app/api/v1/spaces/schema";
import {
  apiErrorSchema,
  unauthorizedErrorSchema,
  validationErrorSchema,
} from "@/lib/openapi/schemas";
import type { RouteConfig } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

// ======================================================
// POST /spaces/[slug]/move
// ======================================================

export const MoveInSpaceParamsSchema = z.object({
  slug: z.string().trim().min(1).meta({
    description: "The space slug.",
    example: "the-office",
  }),
});

export const MoveInSpaceBodySchema = z.object({
  x: z.number().int().min(0).meta({
    description: "Target x position in the room.",
    example: 10,
  }),
  y: z.number().int().min(0).meta({
    description: "Target y position in the room.",
    example: 5,
  }),
});

export const MoveInSpaceResponseSchema = z.object({
  member: SpaceMemberSchema,
}).meta({
  id: "MoveInSpaceResponse",
  description: "Updated member position after moving.",
});

export const MoveInSpaceSuccessStatus = 200;
export const MoveInSpaceSuccessDescription = "Moved to the new position.";

export const MoveInSpaceErrorResponses: RouteConfig["responses"] = {
  400: {
    description: "The request body was invalid or coordinates out of bounds.",
    content: { "application/json": { schema: validationErrorSchema } },
  },
  401: {
    description: "Authentication failed.",
    content: { "application/json": { schema: unauthorizedErrorSchema } },
  },
  403: {
    description: "Agent is not a member of this space. Join first.",
    content: { "application/json": { schema: apiErrorSchema } },
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

export type MoveInSpaceResponse = z.infer<typeof MoveInSpaceResponseSchema>;
