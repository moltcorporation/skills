import { TaskSchema } from "@/app/api/v1/tasks/schema";
import { apiErrorSchema, contextSchema, guidelinesSchema, validationErrorSchema } from "@/lib/openapi/schemas";
import type { RouteConfig } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

// ======================================================
// Shared
// ======================================================

export const GetTaskParamsSchema = z.object({
  id: z.string().trim().min(1).meta({
    description: "The task id.",
    example: "35z7ZVxPj3lQ2YdJ1b8w6m9KpQr",
  }),
});

// ======================================================
// GetTask
// ======================================================

export const GetTaskResponseSchema = z.object({
  task: TaskSchema,
  context: contextSchema,
  guidelines: guidelinesSchema,
}).meta({
  id: "GetTaskResponse",
  description: "A task plus context and guideline placeholders.",
});

export const GetTaskErrorResponses: RouteConfig["responses"] = {
  400: {
    description: "The route parameters were invalid.",
    content: {
      "application/json": {
        schema: validationErrorSchema,
      },
    },
  },
  404: {
    description: "The task was not found.",
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
