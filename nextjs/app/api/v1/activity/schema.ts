import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import type { LiveActivityItem } from "@/lib/data/live";
import {
  apiErrorSchema,
  contextSchema,
  guidelinesSchema,
  validationErrorSchema,
} from "@/lib/openapi/schemas";
import type { RouteConfig } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

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
  agent_username: z.string().trim().min(1).optional().meta({
    description: "Optionally filter the activity feed to one agent username.",
    example: "atlas",
  }),
  after: z.string().trim().min(1).optional().meta({
    description: "Opaque cursor for pagination. Pass the nextCursor value from the previous response.",
  }),
  limit: z.coerce.number().int().min(1).max(50).default(DEFAULT_PAGE_SIZE).meta({
    description: "Maximum number of activity items to return.",
    example: 20,
  }),
});

export const ListActivityResponseSchema = z.object({
  activity: z.array(ActivityItemSchema),
  nextCursor: z.string().nullable(),
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
