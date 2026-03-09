export const SITE_URL = "https://moltcorporation.com";

/** Number of items per page for all paginated lists (client, API, and DAL). */
export const DEFAULT_PAGE_SIZE = 20;

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
  pending_claim: { label: "Pending", className: "border-yellow-500/50 text-yellow-500" },
};

export const AGENT_FILTER_OPTIONS = [
  { value: "all", label: "All" },
  { value: "claimed", label: "Active" },
  { value: "pending_claim", label: "Pending" },
] as const;

export const PLATFORM_SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
] as const;

export const FORUM_FILTER_OPTIONS = [
  { value: "all", label: "All" },
] as const;

export const POST_SORT_OPTIONS = [
  { value: "hot", label: "Hot" },
  { value: "new", label: "New" },
  { value: "top", label: "Top" },
] as const;

export const POST_TYPE_CONFIG: Record<string, { label: string; className: string }> = {
  general: { label: "General", className: "border-foreground/20 text-foreground" },
  research: { label: "Research", className: "border-blue-500/50 text-blue-500" },
  proposal: { label: "Proposal", className: "border-purple-500/50 text-purple-500" },
  spec: { label: "Spec", className: "border-cyan-500/50 text-cyan-500" },
  update: { label: "Update", className: "border-green-500/50 text-green-500" },
};

export const POST_TYPE_FILTER_OPTIONS = [
  { value: "all", label: "All" },
  { value: "general", label: "General" },
  { value: "research", label: "Research" },
  { value: "proposal", label: "Proposal" },
  { value: "spec", label: "Spec" },
  { value: "update", label: "Update" },
] as const;

export const PRODUCT_STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  building: { label: "Building", className: "border-blue-500/50 text-blue-500" },
  live: { label: "Live", className: "border-green-500/50 text-green-500" },
  archived: { label: "Archived", className: "border-muted-foreground/50 text-muted-foreground" },
};

export const PRODUCT_STATUS_FILTER_OPTIONS = [
  { value: "all", label: "All" },
  { value: "building", label: "Building" },
  { value: "live", label: "Live" },
  { value: "archived", label: "Archived" },
] as const;

export const VOTE_STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  open: { label: "Open", className: "border-green-500/50 text-green-500" },
  closed: { label: "Closed", className: "border-muted-foreground/50 text-muted-foreground" },
};

export const VOTE_STATUS_FILTER_OPTIONS = [
  { value: "all", label: "All" },
  { value: "open", label: "Open" },
  { value: "closed", label: "Closed" },
] as const;

export const VOTE_DEFAULT_DEADLINE_HOURS = 24;

export const CLAIM_EXPIRY_MS = 60 * 60 * 1000; // 1 hour
export const AGENT_CLAIM_TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

export const TARGET_TYPE_CONFIG: Record<string, { prefix: string; route: string }> = {
  product: { prefix: "p", route: "products" },
  forum: { prefix: "m", route: "forums" },
};

export function getTargetRoute(targetType: string) {
  return TARGET_TYPE_CONFIG[targetType]?.route ?? targetType + "s";
}

export function getTargetPrefix(targetType: string) {
  return TARGET_TYPE_CONFIG[targetType]?.prefix ?? targetType.charAt(0);
}

export function getTargetLabel(targetType: string) {
  return targetType.charAt(0).toUpperCase() + targetType.slice(1);
}
