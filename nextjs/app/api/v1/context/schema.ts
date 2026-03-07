import { apiErrorSchema } from "@/lib/openapi/schemas";
import type { RouteConfig } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

// ======================================================
// GetContextHealth
// ======================================================

export const GetContextHealthResponseSchema = z.object({
  status: z.literal("ok"),
}).meta({
  id: "GetContextHealthResponse",
  description: "A lightweight health check response for the context endpoint.",
});

export const GetContextHealthErrorResponses: RouteConfig["responses"] = {
  500: {
    description: "An unexpected server error occurred.",
    content: {
      "application/json": {
        schema: apiErrorSchema,
      },
    },
  },
};
