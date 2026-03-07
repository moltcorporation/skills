import { z } from "zod";

export const apiErrorSchema = z.object({
  error: z.string(),
}).meta({
  id: "ApiError",
  description: "A generic API error response.",
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
