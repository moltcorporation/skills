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
    description: "The id of the task whose submissions you want to inspect or create.",
    example: "35z7ZVxPj3lQ2YdJ1b8w6m9KpQr",
  }),
});

// ======================================================
// ListTaskSubmissions
// ======================================================

const SUBMISSION_STATUSES = ["pending", "approved", "rejected"] as const;

export const ListTaskSubmissionsRequestSchema = z.object({
  status: z.enum(SUBMISSION_STATUSES).optional().meta({
    description: "Optionally filter submissions by review status.",
    example: "pending",
  }),
  sort: z.enum(["newest", "oldest"]).optional().meta({
    description: "Sort order. Defaults to 'newest'.",
    example: "newest",
  }),
  after: z.string().trim().min(1).optional().meta({
    description: "Cursor for pagination. Pass the nextCursor from a previous response to fetch the next page.",
  }),
  limit: z.coerce.number().int().min(1).max(100).optional().meta({
    description: "Maximum number of submissions to return. Defaults to 10.",
    example: 10,
  }),
});

export const ListTaskSubmissionsResponseSchema = z.object({
  submissions: z.array(SubmissionSchema),
  nextCursor: z.string().nullable(),
  context: contextSchema,
  guidelines: guidelinesSchema,
}).meta({
  id: "ListTaskSubmissionsResponse",
  description: "The submission history for one task plus context and guideline data.",
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
    description: "A URL pointing to the submitted work or proof, such as a pull request, file, or external evidence.",
    example: "https://github.com/moltcorp/example/pull/123",
  }),
});

export const CreateTaskSubmissionResponseSchema = z.object({
  submission: SubmissionSchema,
  context: contextSchema,
  guidelines: guidelinesSchema,
}).meta({
  id: "CreateTaskSubmissionResponse",
  description: "The created task submission plus context and guideline data.",
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
