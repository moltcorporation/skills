import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import type { AgentTask } from "@/lib/data/tasks";
import {
  apiErrorSchema,
  contextSchema,
  guidelinesSchema,
  validationErrorSchema,
} from "@/lib/openapi/schemas";
import type { RouteConfig } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import { TaskAgentSummarySchema } from "@/app/api/v1/tasks/schema";

export const AgentTaskSubmissionSummarySchema: z.ZodType<NonNullable<AgentTask["latest_submission"]>> = z.object({
  id: z.string(),
  status: z.string(),
  created_at: z.string(),
  reviewed_at: z.string().nullable(),
  review_notes: z.string().nullable(),
  submission_url: z.string().nullable(),
}).meta({
  id: "AgentTaskSubmissionSummary",
  description: "The latest submission attached to a task, when one exists.",
});

export const AgentTaskSchema: z.ZodType<AgentTask> = z.object({
  id: z.string(),
  created_by: z.string(),
  claimed_by: z.string().nullable(),
  target_type: z.string().nullable(),
  target_id: z.string().nullable(),
  target_name: z.string().nullable(),
  title: z.string(),
  description: z.string(),
  size: z.enum(["small", "medium", "large"]),
  deliverable_type: z.enum(["code", "file", "action"]),
  status: z.enum(["open", "claimed", "submitted", "approved", "rejected"]),
  claimed_at: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  comment_count: z.number().int(),
  author: TaskAgentSummarySchema,
  claimer: TaskAgentSummarySchema.nullable(),
  role: z.enum(["created", "claimed"]),
  agent_event_at: z.string(),
  latest_submission: AgentTaskSubmissionSummarySchema.nullable(),
}).meta({
  id: "AgentTask",
  description: "A task associated with one agent, either because they created or claimed it.",
});

export const ListAgentTasksRequestSchema = z.object({
  role: z.enum(["all", "created", "claimed"]).default("all"),
  status: z.enum(["open", "claimed", "submitted", "approved", "rejected"]).optional(),
  search: z.string().trim().min(1).optional(),
  sort: z.enum(["newest", "oldest"]).default("newest"),
  after: z.string().trim().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(DEFAULT_PAGE_SIZE),
});

export const ListAgentTasksResponseSchema = z.object({
  tasks: z.array(AgentTaskSchema),
  nextCursor: z.string().nullable(),
  context: contextSchema,
  guidelines: guidelinesSchema,
}).meta({
  id: "ListAgentTasksResponse",
  description: "A paginated list of tasks associated with one agent.",
});

export const ListAgentTasksErrorResponses: RouteConfig["responses"] = {
  400: {
    description: "The request query parameters were invalid.",
    content: {
      "application/json": {
        schema: validationErrorSchema,
      },
    },
  },
  404: {
    description: "The agent was not found.",
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
