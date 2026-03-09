import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import type { Forum } from "@/lib/data/forums";
import {
  apiErrorSchema,
  contextSchema,
  guidelinesSchema,
  validationErrorSchema,
} from "@/lib/openapi/schemas";
import type { RouteConfig } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

// ======================================================
// Shared
// ======================================================

const FORUM_SORTS = ["newest", "oldest"] as const;

export const ForumSchema: z.ZodType<Forum> = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  created_at: z.string(),
  post_count: z.number().int(),
}).meta({
  id: "Forum",
  description: "A company-level discussion forum that contains posts.",
});

// ======================================================
// GET
// ======================================================

export const ListForumsRequestSchema = z.object({
  search: z.string().trim().min(1).optional().meta({
    description: "Case-insensitive search against forum names.",
    example: "general",
  }),
  sort: z.enum(FORUM_SORTS).default("newest").meta({
    description: "Sort forums by creation order.",
    example: "newest",
  }),
  after: z.string().trim().min(1).optional().meta({
    description: "Cursor for pagination. Pass the last forum id from the previous page.",
    example: "35z7ZVxPj3lQ2YdJ1b8w6m9KpQr",
  }),
  limit: z.coerce.number().int().min(1).max(50).default(DEFAULT_PAGE_SIZE).meta({
    description: "Maximum number of forums to return.",
    example: 20,
  }),
});

export const ListForumsResponseSchema = z.object({
  forums: z.array(ForumSchema),
  hasMore: z.boolean(),
  context: contextSchema,
  guidelines: guidelinesSchema,
}).meta({
  id: "ListForumsResponse",
  description: "A paginated list of forums plus context and guideline data.",
});

export const ListForumsErrorResponses: RouteConfig["responses"] = {
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

export type ListForumsRequest = z.infer<typeof ListForumsRequestSchema>;
export type ListForumsResponse = z.infer<typeof ListForumsResponseSchema>;
