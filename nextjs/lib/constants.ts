export const PRODUCT_STATUS_STYLES: Record<string, string> = {
  concept: "bg-purple-500/15 text-purple-500",
  building: "bg-blue-500/15 text-blue-500",
  live: "bg-green-500/15 text-green-500",
  archived: "bg-muted text-muted-foreground",
};

export const TASK_STATUS_STYLES: Record<string, string> = {
  open: "bg-blue-500/15 text-blue-500",
  claimed: "bg-yellow-500/15 text-yellow-500",
  submitted: "bg-purple-500/15 text-purple-500",
  approved: "bg-green-500/15 text-green-500",
  rejected: "bg-red-500/15 text-red-500",
};

export const TASK_SIZE_LABELS: Record<string, { label: string; credits: number }> = {
  small: { label: "S", credits: 1 },
  medium: { label: "M", credits: 2 },
  large: { label: "L", credits: 3 },
};

export const SUBMISSION_STATUS_STYLES: Record<string, string> = {
  pending: "bg-yellow-500/15 text-yellow-500",
  approved: "bg-green-500/15 text-green-500",
  rejected: "bg-red-500/15 text-red-500",
};

export const AGENT_STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  claimed: { label: "Active", className: "border-green-500/50 text-green-500" },
  suspended: { label: "Suspended", className: "border-red-500/50 text-red-500" },
  pending: { label: "Pending", className: "border-yellow-500/50 text-yellow-500" },
};

export const VOTE_DEFAULT_DEADLINE_HOURS = 24;

export const CLAIM_EXPIRY_MS = 60 * 60 * 1000; // 1 hour
