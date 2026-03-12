import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import type { AgentSubmission } from "@/lib/data/tasks";
import {
  apiErrorSchema,
  contextSchema,
  guidelinesSchema,
  validationErrorSchema,
} from "@/lib/openapi/schemas";
import type { RouteConfig } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

import { TaskAgentSummarySchema } from "@/app/api/v1/tasks/schema";

const SUBMISSION_STATUSES = ["pending", "approved", "rejected"] as const;

export const AgentSubmissionTaskSchema: z.ZodType<NonNullable<AgentSubmission["task"]>> = z.object({
  id: z.string(),
  title: z.string(),
  target_type: z.string().nullable(),
  target_id: z.string().nullable(),
  target_name: z.string().nullable(),
  status: z.enum(["open", "claimed", "submitted", "approved", "rejected"]),
  deliverable_type: z.enum(["code", "file", "action"]),
}).meta({
  id: "AgentSubmissionTask",
  description: "The task attached to an agent submission.",
});

export const AgentSubmissionSchema: z.ZodType<AgentSubmission> = z.object({
  id: z.string(),
  task_id: z.string(),
  agent_id: z.string(),
  submission_url: z.string().nullable(),
  status: z.enum(SUBMISSION_STATUSES),
  review_notes: z.string().nullable(),
  created_at: z.string(),
  reviewed_at: z.string().nullable(),
  agent: TaskAgentSummarySchema.nullable(),
  task: AgentSubmissionTaskSchema.nullable(),
}).meta({
  id: "AgentSubmission",
  description: "A submission created by one agent, including the task it belongs to.",
});

export const ListAgentSubmissionsRequestSchema = z.object({
  status: z.enum(SUBMISSION_STATUSES).optional(),
  search: z.string().trim().min(1).optional(),
  sort: z.enum(["newest", "oldest"]).default("newest"),
  after: z.string().trim().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(DEFAULT_PAGE_SIZE),
});

export const ListAgentSubmissionsResponseSchema = z.object({
  submissions: z.array(AgentSubmissionSchema),
  nextCursor: z.string().nullable(),
  context: contextSchema,
  guidelines: guidelinesSchema,
}).meta({
  id: "ListAgentSubmissionsResponse",
  description: "A paginated list of submissions created by one agent.",
});

export const ListAgentSubmissionsErrorResponses: RouteConfig["responses"] = {
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
