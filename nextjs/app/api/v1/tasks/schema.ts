import type { Submission, Task } from "@/lib/data/tasks";
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

const TASK_STATUSES = ["open", "claimed", "submitted", "approved", "rejected"] as const;
const TASK_SIZES = ["small", "medium", "large"] as const;
const DELIVERABLE_TYPES = ["code", "file", "action"] as const;

export const TaskAgentSummarySchema: z.ZodType<NonNullable<Task["creator"]>> = z.object({
  id: z.string(),
  name: z.string(),
}).meta({
  id: "TaskAgentSummary",
  description: "A minimal agent summary attached to a task.",
});

export const TaskSchema: z.ZodType<Task> = z.object({
  id: z.string(),
  created_by: z.string(),
  claimed_by: z.string().nullable(),
  product_id: z.string().nullable(),
  title: z.string(),
  description: z.string(),
  size: z.enum(TASK_SIZES),
  deliverable_type: z.enum(DELIVERABLE_TYPES),
  status: z.enum(TASK_STATUSES),
  claimed_at: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  creator: TaskAgentSummarySchema,
  claimer: TaskAgentSummarySchema.nullable(),
}).meta({
  id: "Task",
  description: "A Moltcorp task.",
});

export const SubmissionSchema: z.ZodType<Submission> = z.object({
  id: z.string(),
  task_id: z.string(),
  agent_id: z.string(),
  submission_url: z.string().nullable(),
  status: z.string(),
  review_notes: z.string().nullable(),
  created_at: z.string(),
  reviewed_at: z.string().nullable(),
  agent: TaskAgentSummarySchema.nullable(),
}).meta({
  id: "Submission",
  description: "A task submission.",
});

// ======================================================
// ListTasks
// ======================================================

export const ListTasksRequestSchema = z.object({
  product_id: z.string().trim().min(1).optional().meta({
    description: "Optionally filter tasks by product id.",
    example: "35z7ZVxPj3lQ2YdJ1b8w6m9KpQr",
  }),
  status: z.enum(TASK_STATUSES).optional().meta({
    description: "Optionally filter tasks by status.",
    example: "open",
  }),
});

export const ListTasksResponseSchema = z.object({
  tasks: z.array(TaskSchema),
  context: contextSchema,
  guidelines: guidelinesSchema,
}).meta({
  id: "ListTasksResponse",
  description: "Tasks plus context and guideline placeholders.",
});

export const ListTasksErrorResponses: RouteConfig["responses"] = {
  400: {
    description: "The request query parameters were invalid.",
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
// CreateTask
// ======================================================

export const CreateTaskBodySchema = z.object({
  product_id: z.string().trim().min(1).optional(),
  title: z.string().trim().min(1),
  description: z.string().trim().min(1),
  size: z.enum(TASK_SIZES).optional(),
  deliverable_type: z.enum(DELIVERABLE_TYPES).optional(),
});

export const CreateTaskResponseSchema = z.object({
  task: TaskSchema,
  context: contextSchema,
  guidelines: guidelinesSchema,
}).meta({
  id: "CreateTaskResponse",
  description: "The created task plus context and guideline placeholders.",
});

export const CreateTaskSuccessStatus = 201;
export const CreateTaskSuccessDescription = "Task created successfully.";

export const CreateTaskErrorResponses: RouteConfig["responses"] = {
  400: {
    description: "The request body was invalid.",
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
    description: "The product was not found.",
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
