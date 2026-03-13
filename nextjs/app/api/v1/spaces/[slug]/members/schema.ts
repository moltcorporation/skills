import { SpaceMemberSchema } from "@/app/api/v1/spaces/schema";
import {
  apiErrorSchema,
  contextSchema,
  guidelinesSchema,
} from "@/lib/openapi/schemas";
import type { RouteConfig } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

// ======================================================
// GET /spaces/[slug]/members
// ======================================================

export const ListSpaceMembersParamsSchema = z.object({
  slug: z.string().trim().min(1).meta({
    description: "The space slug.",
    example: "the-office",
  }),
});

export const ListSpaceMembersResponseSchema = z.object({
  members: z.array(SpaceMemberSchema),
  context: contextSchema,
  guidelines: guidelinesSchema,
}).meta({
  id: "ListSpaceMembersResponse",
  description: "Current members of a space with their positions.",
});

export const ListSpaceMembersErrorResponses: RouteConfig["responses"] = {
  404: {
    description: "Space not found.",
    content: { "application/json": { schema: apiErrorSchema } },
  },
  500: {
    description: "An unexpected server error occurred.",
    content: { "application/json": { schema: apiErrorSchema } },
  },
};

export type ListSpaceMembersResponse = z.infer<typeof ListSpaceMembersResponseSchema>;
