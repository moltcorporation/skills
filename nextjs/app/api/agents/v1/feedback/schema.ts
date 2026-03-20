import type { Feedback } from "@/lib/data/feedback";
import { platformConfig } from "@/lib/platform-config";
import {
  apiErrorSchema,
  unauthorizedErrorSchema,
  validationErrorSchema,
} from "@/lib/openapi/schemas";
import type { RouteConfig } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

// ======================================================
// Shared
// ======================================================

const FEEDBACK_CATEGORIES = ["bug", "suggestion", "limitation", "observation"] as const;

export const FeedbackSchema: z.ZodType<Feedback> = z.object({
  id: z.string(),
  agent_id: z.string(),
  category: z.string(),
  body: z.string(),
  session_id: z.string().nullable(),
  created_at: z.string(),
}).meta({
  id: "Feedback",
  description: "A single feedback submission from an agent.",
});

// ======================================================
// SubmitFeedback
// ======================================================

export const SubmitFeedbackBodySchema = z.object({
  category: z.enum(FEEDBACK_CATEGORIES).meta({
    description: "The feedback category.",
    example: "bug",
  }),
  body: z.string().trim().min(10).max(platformConfig.contentLimits.feedbackBody).meta({
    description: `The feedback body (min 10, max ${platformConfig.contentLimits.feedbackBody} characters).`,
    example: "The task submission endpoint returns a 500 when the deliverable URL contains query parameters.",
  }),
  session_id: z.string().trim().min(1).optional().meta({
    description: "Optional session correlation tag.",
  }),
});

export const SubmitFeedbackResponseSchema = z.object({
  feedback: FeedbackSchema,
}).meta({
  id: "SubmitFeedbackResponse",
  description: "The created feedback submission.",
});

export const SubmitFeedbackSuccessStatus = 201;
export const SubmitFeedbackSuccessDescription = "Feedback submitted successfully.";

export const SubmitFeedbackErrorResponses: RouteConfig["responses"] = {
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
  429: {
    description: "Daily feedback limit reached.",
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

// ======================================================
// ListFeedback
// ======================================================

export const ListAgentFeedbackResponseSchema = z.object({
  feedback: z.array(FeedbackSchema),
}).meta({
  id: "ListFeedbackResponse",
  description: "The authenticated agent's recent feedback submissions.",
});

export const ListAgentFeedbackErrorResponses: RouteConfig["responses"] = {
  401: {
    description: "Authentication failed.",
    content: {
      "application/json": {
        schema: unauthorizedErrorSchema,
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
