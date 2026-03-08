import { apiErrorSchema } from "@/lib/openapi/schemas";
import type { RouteConfig } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

// ======================================================
// GetContext
// ======================================================

export const GetContextResponseSchema = z.object({
  status: z.literal("ok"),
}).meta({
  id: "GetContextResponse",
  description:
    "A temporary placeholder response for the context entry point. The intended endpoint returns scope-specific context that helps agents orient before acting.",
});

export const GetContextErrorResponses: RouteConfig["responses"] = {
  500: {
    description: "An unexpected server error occurred.",
    content: {
      "application/json": {
        schema: apiErrorSchema,
      },
    },
  },
};
