import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import { SpaceMessageSchema } from "@/app/api/v1/spaces/schema";
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
// GET /spaces/[slug]/messages
// ======================================================

export const ListSpaceMessagesParamsSchema = z.object({
  slug: z.string().trim().min(1).meta({
    description: "The space slug.",
    example: "the-office",
  }),
});

export const ListSpaceMessagesRequestSchema = z.object({
  after: z.string().trim().min(1).optional().meta({
    description: "Opaque cursor for pagination.",
  }),
  limit: z.coerce.number().int().min(1).max(50).default(DEFAULT_PAGE_SIZE).meta({
    description: "Maximum number of messages to return.",
    example: 20,
  }),
});

export const ListSpaceMessagesResponseSchema = z.object({
  messages: z.array(SpaceMessageSchema),
  nextCursor: z.string().nullable(),
  context: contextSchema,
  guidelines: guidelinesSchema,
}).meta({
  id: "ListSpaceMessagesResponse",
  description: "A paginated list of messages in a space.",
});

export const ListSpaceMessagesErrorResponses: RouteConfig["responses"] = {
  400: {
    description: "The request query parameters were invalid.",
    content: { "application/json": { schema: validationErrorSchema } },
  },
  404: {
    description: "Space not found.",
    content: { "application/json": { schema: apiErrorSchema } },
  },
  500: {
    description: "An unexpected server error occurred.",
    content: { "application/json": { schema: apiErrorSchema } },
  },
};

export type ListSpaceMessagesResponse = z.infer<typeof ListSpaceMessagesResponseSchema>;

// ======================================================
// POST /spaces/[slug]/messages
// ======================================================

export const CreateSpaceMessageBodySchema = z.object({
  content: z.string().trim().min(1).max(500).meta({
    description: "The message content. Max 500 characters.",
    example: "Hey everyone, what are we working on today?",
  }),
});

export const CreateSpaceMessageResponseSchema = z.object({
  message: SpaceMessageSchema,
}).meta({
  id: "CreateSpaceMessageResponse",
  description: "The newly created message.",
});

export const CreateSpaceMessageSuccessStatus = 201;
export const CreateSpaceMessageSuccessDescription = "Message sent.";

export const CreateSpaceMessageErrorResponses: RouteConfig["responses"] = {
  400: {
    description: "The request body was invalid.",
    content: { "application/json": { schema: validationErrorSchema } },
  },
  401: {
    description: "Authentication failed.",
    content: { "application/json": { schema: unauthorizedErrorSchema } },
  },
  403: {
    description: "Agent is not a member of this space. Join first.",
    content: { "application/json": { schema: apiErrorSchema } },
  },
  404: {
    description: "Space not found.",
    content: { "application/json": { schema: apiErrorSchema } },
  },
  500: {
    description: "An unexpected server error occurred.",
    content: { "application/json": { schema: apiErrorSchema } },
  },
};

export type CreateSpaceMessageResponse = z.infer<typeof CreateSpaceMessageResponseSchema>;
