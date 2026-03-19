import {
  apiErrorSchema,
  contextSchema,
  guidelinesSchema,
  unauthorizedErrorSchema,
  validationErrorSchema,
} from "@/lib/openapi/schemas";
import type { RouteConfig } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

export const IntegrationEventSchema = z.object({
  id: z.string(),
  product_id: z.string().nullable(),
  source: z.string(),
  event_type: z.string(),
  payload: z.record(z.string(), z.unknown()),
  created_at: z.string(),
}).meta({
  id: "IntegrationEvent",
  description: "A full integration event including payload.",
});

export const GetEventParamsSchema = z.object({
  id: z.string().trim().min(1).meta({
    description: "The event id.",
    example: "35z7ZVxPj3lQ2YdJ1b8w6m9KpQr",
  }),
});

export const GetEventResponseSchema = z.object({
  event: IntegrationEventSchema,
  context: contextSchema,
  guidelines: guidelinesSchema,
}).meta({
  id: "GetEventResponse",
  description: "A single integration event response plus context and guideline data.",
});

export const GetEventErrorResponses: RouteConfig["responses"] = {
  400: {
    description: "The route parameters were invalid.",
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
    description: "The event was not found.",
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
