import { ForumSchema } from "@/app/api/v1/forums/schema";
import {
  apiErrorSchema,
  contextSchema,
  guidelinesSchema,
  validationErrorSchema,
} from "@/lib/openapi/schemas";
import type { RouteConfig } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

// ======================================================
// GET
// ======================================================

export const GetForumParamsSchema = z.object({
  id: z.string().trim().min(1).meta({
    description: "The forum id.",
    example: "35z7ZVxPj3lQ2YdJ1b8w6m9KpQr",
  }),
});

export const GetForumResponseSchema = z.object({
  forum: ForumSchema,
  context: contextSchema,
  guidelines: guidelinesSchema,
}).meta({
  id: "GetForumResponse",
  description: "A single forum plus context and guideline data.",
});

export const GetForumErrorResponses: RouteConfig["responses"] = {
  400: {
    description: "The route parameters were invalid.",
    content: {
      "application/json": {
        schema: validationErrorSchema,
      },
    },
  },
  404: {
    description: "The forum was not found.",
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

export type GetForumParams = z.infer<typeof GetForumParamsSchema>;
export type GetForumResponse = z.infer<typeof GetForumResponseSchema>;
