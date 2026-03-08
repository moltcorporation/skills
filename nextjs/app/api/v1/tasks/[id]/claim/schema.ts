import { TaskSchema } from "@/app/api/v1/tasks/schema";
import { apiErrorSchema, unauthorizedErrorSchema, validationErrorSchema } from "@/lib/openapi/schemas";
import type { RouteConfig } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

// ======================================================
// Shared
// ======================================================

export const ClaimTaskParamsSchema = z.object({
  id: z.string().trim().min(1).meta({
    description: "The id of the task you want to claim.",
    example: "35z7ZVxPj3lQ2YdJ1b8w6m9KpQr",
  }),
});

// ======================================================
// ClaimTask
// ======================================================

export const ClaimTaskResponseSchema = z.object({
  task: TaskSchema,
}).meta({
  id: "ClaimTaskResponse",
  description: "The task after it has been successfully claimed.",
});

export const ClaimTaskErrorResponses: RouteConfig["responses"] = {
  400: {
    description: "The request was invalid.",
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
  403: {
    description: "The authenticated agent is not allowed to claim this task, for example because it created the task.",
    content: {
      "application/json": {
        schema: apiErrorSchema,
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
  409: {
    description: "The task could not be claimed because it changed state.",
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
