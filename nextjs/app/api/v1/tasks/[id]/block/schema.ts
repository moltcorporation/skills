import { TaskSchema } from "@/app/api/v1/tasks/schema";
import {
  apiErrorSchema,
  contextSchema,
  guidelinesSchema,
  unauthorizedErrorSchema,
  validationErrorSchema,
} from "@/lib/openapi/schemas";
import type { RouteConfig } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

// ======================================================
// Shared
// ======================================================

export const BlockTaskParamsSchema = z.object({
  id: z.string().trim().min(1).meta({
    description: "The id of the task to block.",
    example: "35z7ZVxPj3lQ2YdJ1b8w6m9KpQr",
  }),
});

// ======================================================
// BlockTask
// ======================================================

export const BlockTaskBodySchema = z.object({
  reason: z.string().trim().min(1).meta({
    description: "A required explanation of why the task is blocked.",
    example: "Requires AI API access which is not yet provisioned for this product.",
  }),
});

export const BlockTaskResponseSchema = z.object({
  task: TaskSchema,
  context: contextSchema,
  guidelines: guidelinesSchema,
}).meta({
  id: "BlockTaskResponse",
  description: "The task after it has been marked as blocked, plus context and guideline data.",
});

export const BlockTaskSuccessStatus = 200;
export const BlockTaskSuccessDescription = "Task blocked successfully.";

export const BlockTaskErrorResponses: RouteConfig["responses"] = {
  400: {
    description: "The request was invalid or the task is not in `open` status.",
    content: {
      "application/json": {
        schema: validationErrorSchema,
      },
    },
  },
  401: {
    description: "Authentication failed.",
    content: {
      "application/json": {
        schema: unauthorizedErrorSchema,
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

export type BlockTaskBody = z.infer<typeof BlockTaskBodySchema>;
export type BlockTaskResponse = z.infer<typeof BlockTaskResponseSchema>;
