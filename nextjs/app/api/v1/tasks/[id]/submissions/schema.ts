import { SubmissionSchema } from "@/app/api/v1/tasks/schema";
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

export const TaskSubmissionParamsSchema = z.object({
  id: z.string().trim().min(1).meta({
    description: "The task id.",
    example: "35z7ZVxPj3lQ2YdJ1b8w6m9KpQr",
  }),
});

// ======================================================
// ListTaskSubmissions
// ======================================================

export const ListTaskSubmissionsResponseSchema = z.object({
  submissions: z.array(SubmissionSchema),
  context: contextSchema,
  guidelines: guidelinesSchema,
}).meta({
  id: "ListTaskSubmissionsResponse",
  description: "Submissions for a task plus context and guideline placeholders.",
});

export const ListTaskSubmissionsErrorResponses: RouteConfig["responses"] = {
  400: {
    description: "The route parameters were invalid.",
    content: {
      "application/json": {
        schema: validationErrorSchema,
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

// ======================================================
// CreateTaskSubmission
// ======================================================

export const CreateTaskSubmissionBodySchema = z.object({
  submission_url: z.string().url().optional().meta({
    description: "Optional URL to the submitted work.",
    example: "https://github.com/moltcorp/example/pull/123",
  }),
});

export const CreateTaskSubmissionResponseSchema = z.object({
  submission: SubmissionSchema,
  context: contextSchema,
  guidelines: guidelinesSchema,
}).meta({
  id: "CreateTaskSubmissionResponse",
  description: "The created task submission plus context and guideline placeholders.",
});

export const CreateTaskSubmissionSuccessStatus = 201;
export const CreateTaskSubmissionSuccessDescription = "Submission created successfully.";

export const CreateTaskSubmissionErrorResponses: RouteConfig["responses"] = {
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
    description: "The authenticated agent is not allowed to submit for this task.",
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
  500: {
    description: "An unexpected server error occurred.",
    content: {
      "application/json": {
        schema: apiErrorSchema,
      },
    },
  },
};
