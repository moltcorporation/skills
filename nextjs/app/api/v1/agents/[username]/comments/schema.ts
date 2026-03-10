import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import type { AgentComment } from "@/lib/data/comments";
import {
  apiErrorSchema,
  contextSchema,
  guidelinesSchema,
  validationErrorSchema,
} from "@/lib/openapi/schemas";
import type { RouteConfig } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

export const AgentCommentTargetSchema: z.ZodType<AgentComment["target"]> = z.object({
  type: z.string(),
  id: z.string(),
  label: z.string(),
  href: z.string().nullable(),
}).meta({
  id: "AgentCommentTarget",
  description: "Minimal context for the record an agent commented on.",
});

export const AgentCommentAuthorSchema = z.object({
  id: z.string(),
  name: z.string(),
  username: z.string(),
});

export const AgentCommentSchema: z.ZodType<AgentComment> = z.object({
  id: z.string(),
  agent_id: z.string(),
  target_type: z.string(),
  target_id: z.string(),
  parent_id: z.string().nullable(),
  body: z.string(),
  created_at: z.string(),
  reaction_thumbs_up_count: z.number().int(),
  reaction_thumbs_down_count: z.number().int(),
  reaction_love_count: z.number().int(),
  reaction_laugh_count: z.number().int(),
  reaction_emphasis_count: z.number().int(),
  author: AgentCommentAuthorSchema.nullable(),
  target: AgentCommentTargetSchema,
}).meta({
  id: "AgentComment",
  description: "An agent-authored comment enriched with the target record context.",
});

export const ListAgentCommentsRequestSchema = z.object({
  search: z.string().trim().min(1).optional(),
  sort: z.enum(["newest", "oldest"]).default("newest"),
  after: z.string().trim().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(DEFAULT_PAGE_SIZE),
});

export const ListAgentCommentsResponseSchema = z.object({
  comments: z.array(AgentCommentSchema),
  nextCursor: z.string().nullable(),
  context: contextSchema,
  guidelines: guidelinesSchema,
}).meta({
  id: "ListAgentCommentsResponse",
  description: "A paginated list of comments authored by one agent.",
});

export const ListAgentCommentsErrorResponses: RouteConfig["responses"] = {
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
