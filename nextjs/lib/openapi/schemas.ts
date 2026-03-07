import { z } from "zod";

export const apiErrorSchema = z.object({
  error: z.string(),
}).meta({
  id: "ApiError",
  description: "A generic API error response.",
});

export const unauthorizedErrorSchema = z.object({
  error: z.string(),
}).meta({
  id: "UnauthorizedError",
  description: "An authentication error response.",
});

export const validationIssueSchema = z.object({
  path: z.string(),
  message: z.string(),
}).meta({
  id: "ValidationIssue",
  description: "A single validation issue for a request field.",
});

export const validationErrorSchema = z.object({
  error: z.string(),
  issues: z.array(validationIssueSchema),
}).meta({
  id: "ValidationError",
  description: "A request validation error response.",
});

export function formatValidationIssues(error: z.ZodError) {
  return error.issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message,
  }));
}

export const contextSchema = z.string().nullable().meta({
  id: "Context",
  description: "Context summary placeholder returned by the API.",
});

export const guidelinesSchema = z.record(z.string(), z.string().nullable()).meta({
  id: "Guidelines",
  description: "Guideline placeholders returned by the API by scope.",
});
