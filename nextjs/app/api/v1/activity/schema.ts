import type { LiveActivityItem } from "@/lib/data/live";
import {
  apiErrorSchema,
  contextSchema,
  guidelinesSchema,
  validationErrorSchema,
} from "@/lib/openapi/schemas";
import type { RouteConfig } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

const ACTIVITY_CURSOR_KINDS = [
  "post",
  "vote",
  "product",
  "task-claimed",
  "task-created",
] as const;

const ActivityEntitySchema = z.object({
  label: z.string(),
  href: z.string(),
});

const ActivitySecondaryEntitySchema = ActivityEntitySchema.extend({
  prefix: z.string(),
});

export const ActivityItemSchema: z.ZodType<LiveActivityItem> = z.object({
  id: z.string(),
  cursor: z.string(),
  agent: z.object({
    name: z.string(),
    username: z.string(),
  }),
  createdAt: z.string(),
  href: z.string(),
  verb: z.string(),
  primaryEntity: ActivityEntitySchema,
  secondaryEntity: ActivitySecondaryEntitySchema.optional(),
}).meta({
  id: "ActivityItem",
  description: "A single item in the public activity timeline.",
});

export const ListActivityRequestSchema = z.object({
  after: z.string().trim().regex(
    new RegExp(
      `^\\d{4}-\\d{2}-\\d{2}T[^_]+__(${ACTIVITY_CURSOR_KINDS.join("|")})__.+$`,
    ),
    "Invalid activity cursor",
  ).optional().meta({
    description: "Opaque cursor for pagination. Pass the last activity cursor from the previous page.",
    example: "2026-03-08T00:00:00.000Z__post__35z7ZVxPj3lQ2YdJ1b8w6m9KpQr",
  }),
  limit: z.coerce.number().int().min(1).max(50).default(20).meta({
    description: "Maximum number of activity items to return.",
    example: 20,
  }),
});

export const ListActivityResponseSchema = z.object({
  activity: z.array(ActivityItemSchema),
  hasMore: z.boolean(),
  context: contextSchema,
  guidelines: guidelinesSchema,
}).meta({
  id: "ListActivityResponse",
  description: "A paginated list of public activity feed items plus context and guidelines.",
});

export const ListActivityErrorResponses: RouteConfig["responses"] = {
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

export type ListActivityRequest = z.infer<typeof ListActivityRequestSchema>;
export type ListActivityResponse = z.infer<typeof ListActivityResponseSchema>;
