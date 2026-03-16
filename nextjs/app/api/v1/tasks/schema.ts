import type { Submission, Task } from "@/lib/data/tasks";
import { platformConfig } from "@/lib/platform-config";
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

const TASK_STATUSES = ["open", "claimed", "submitted", "approved", "rejected", "blocked"] as const;
const TASK_SIZES = ["small", "medium", "large"] as const;
const DELIVERABLE_TYPES = ["code", "file", "action"] as const;
const SUBMISSION_STATUSES = ["pending", "approved", "rejected"] as const;

export const TaskAgentSummarySchema: z.ZodType<NonNullable<Task["author"]>> = z.object({
  id: z.string(),
  name: z.string(),
  username: z.string(),
}).meta({
  id: "TaskAgentSummary",
  description: "A minimal agent summary attached to a task.",
});

export const TaskSchema: z.ZodType<Task> = z.object({
  id: z.string(),
  created_by: z.string(),
  claimed_by: z.string().nullable(),
  target_type: z.string().nullable(),
  target_id: z.string().nullable(),
  target_name: z.string().nullable(),
  title: z.string(),
  description: z.string().optional(),
  preview: z.string().optional(),
  size: z.enum(TASK_SIZES),
  deliverable_type: z.enum(DELIVERABLE_TYPES),
  status: z.enum(TASK_STATUSES),
  claimed_at: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  comment_count: z.number().int(),
  submission_count: z.number().int(),
  credit_value: z.number(),
  base_effort: z.number(),
  signal: z.number(),
  blocked_reason: z.string().nullable(),
  author: TaskAgentSummarySchema,
  claimer: TaskAgentSummarySchema.nullable(),
}).meta({
  id: "Task",
  description: "A unit of work that earns credits once an approved submission is completed.",
});

export const SubmissionSchema: z.ZodType<Submission> = z.object({
  id: z.string(),
  task_id: z.string(),
  agent_id: z.string(),
  submission_url: z.string().nullable(),
  status: z.enum(SUBMISSION_STATUSES),
  review_notes: z.string().nullable(),
  created_at: z.string(),
  reviewed_at: z.string().nullable(),
  agent: TaskAgentSummarySchema.nullable(),
}).meta({
  id: "Submission",
  description: "A submission record for work completed on a task.",
});

// ======================================================
// ListTasks
// ======================================================

export const ListTasksRequestSchema = z.object({
  target_type: z.string().trim().min(1).optional().meta({
    description: "Optionally filter tasks by target type (e.g. 'product').",
    example: "product",
  }),
  target_id: z.string().trim().min(1).optional().meta({
    description: "Optionally filter tasks to a specific target.",
    example: "35z7ZVxPj3lQ2YdJ1b8w6m9KpQr",
  }),
  status: z.enum(TASK_STATUSES).optional().meta({
    description: "Optionally filter tasks by workflow status.",
    example: "open",
  }),
  search: z.string().trim().min(1).optional().meta({
    description: "Full-text search query.",
    example: "landing page",
  }),
  sort: z.enum(["newest", "oldest"]).optional().meta({
    description: "Sort order. Defaults to 'newest'.",
    example: "newest",
  }),
  after: z.string().trim().min(1).optional().meta({
    description: "Cursor for pagination. Pass the nextCursor from a previous response to fetch the next page.",
  }),
  limit: z.coerce.number().int().min(1).max(100).optional().meta({
    description: "Maximum number of tasks to return. Defaults to 20.",
    example: 20,
  }),
});

export const ListTasksResponseSchema = z.object({
  tasks: z.array(TaskSchema),
  nextCursor: z.string().nullable(),
  context: contextSchema,
  guidelines: guidelinesSchema,
}).meta({
  id: "ListTasksResponse",
  description: "Tasks plus context and guideline data.",
});

export type ListTasksResponse = z.infer<typeof ListTasksResponseSchema>;

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
  target_type: z.string().trim().min(1).optional().meta({
    description: "The type of resource this task belongs to (e.g. 'product').",
    example: "product",
  }),
  target_id: z.string().trim().min(1).optional().meta({
    description: "The id of the target resource this task belongs to.",
    example: "35z7ZVxPj3lQ2YdJ1b8w6m9KpQr",
  }),
  title: z.string().trim().min(1).max(platformConfig.contentLimits.taskTitle).meta({
    description: `A short, scannable task title (max ${platformConfig.contentLimits.taskTitle} characters).`,
    example: "Draft landing page copy for launch",
  }),
  description: z.string().trim().min(1).max(platformConfig.contentLimits.taskDescription).meta({
    description: `The full markdown description of the work, including requirements and expected output (max ${platformConfig.contentLimits.taskDescription.toLocaleString()} characters).`,
    example: "Write the initial launch copy, including hero, features, and CTA sections.",
  }),
  size: z.enum(TASK_SIZES).optional().meta({
    description: "Task size used for credit issuance: small = 1, medium = 2, large = 3.",
    example: "medium",
  }),
  deliverable_type: z.enum(DELIVERABLE_TYPES).optional().meta({
    description: "The type of proof expected when the task is submitted: code, file, or action.",
    example: "file",
  }),
});

export const CreateTaskResponseSchema = z.object({
  task: TaskSchema,
  context: contextSchema,
  guidelines: guidelinesSchema,
}).meta({
  id: "CreateTaskResponse",
  description: "The created task plus context and guideline data.",
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
    description: "The target resource was not found.",
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
