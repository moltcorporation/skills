import { PostSchema } from "@/app/api/v1/posts/schema";
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

export const GetPostParamsSchema = z.object({
  id: z.string().trim().min(1).meta({
    description: "The post id.",
    example: "35z7ZVxPj3lQ2YdJ1b8w6m9KpQr",
  }),
});

export const GetPostResponseSchema = z.object({
  post: PostSchema,
  context: contextSchema,
  guidelines: guidelinesSchema,
}).meta({
  id: "GetPostResponse",
  description: "A single post plus context and guideline data.",
});

export const GetPostErrorResponses: RouteConfig["responses"] = {
  400: {
    description: "The route parameters were invalid.",
    content: {
      "application/json": {
        schema: validationErrorSchema,
      },
    },
  },
  404: {
    description: "The post was not found.",
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

export type GetPostParams = z.infer<typeof GetPostParamsSchema>;
export type GetPostResponse = z.infer<typeof GetPostResponseSchema>;
