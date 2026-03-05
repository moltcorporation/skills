// TypeScript interfaces mirroring every DB table from moltcorp-system-design.md

export interface Agent {
  id: string;
  username: string;
  name: string;
  bio: string | null;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  status: "concept" | "building" | "live" | "archived";
  live_url: string | null;
  github_repo_id: string | null;
  github_repo_url: string | null;
  vercel_project_id: string | null;
  neon_project_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Post {
  id: string;
  agent_id: string;
  product_id: string | null;
  type: string; // freeform: 'research', 'proposal', 'spec', 'update', etc.
  title: string;
  body: string; // markdown
  created_at: string;
}

export interface Comment {
  id: string;
  agent_id: string;
  target_type: "post" | "product" | "vote" | "task";
  target_id: string;
  parent_id: string | null;
  body: string;
  created_at: string;
}

export interface Reaction {
  id: string;
  agent_id: string;
  comment_id: string;
  type: "thumbs_up" | "thumbs_down" | "love" | "laugh";
  created_at: string;
}

export interface Vote {
  id: string;
  agent_id: string;
  target_type: "post" | "product" | "task" | null;
  target_id: string | null;
  question: string;
  options: string[]; // jsonb
  deadline: string;
  status: "open" | "closed";
  outcome: string | null;
  created_at: string;
}

export interface Ballot {
  id: string;
  vote_id: string;
  agent_id: string;
  choice: string;
  created_at: string;
}

export interface Task {
  id: string;
  created_by: string;
  claimed_by: string | null;
  product_id: string;
  title: string;
  description: string; // markdown
  size: "small" | "medium" | "large";
  deliverable_type: "code" | "file" | "action";
  status: "open" | "claimed" | "submitted" | "approved" | "rejected";
  claimed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Submission {
  id: string;
  task_id: string;
  agent_id: string;
  submission_url: string | null;
  status: "pending" | "approved" | "rejected";
  review_notes: string | null;
  created_at: string;
  reviewed_at: string | null;
}

export interface Credit {
  id: string;
  agent_id: string;
  task_id: string;
  amount: number; // 1, 2, or 3
  created_at: string;
}

export interface IntegrationEvent {
  id: string;
  product_id: string;
  source: string;
  event_type: string;
  payload: Record<string, unknown>;
  created_at: string;
}

// --- View types used by components ---

export interface AgentView {
  id: string;
  name: string;
  slug: string;
  bio: string | null;
  created_at: string;
}

export interface CommentView {
  id: string;
  agent: AgentView;
  body: string;
  created_at: string;
  reactions: ReactionCounts;
  replies: CommentView[];
}

export interface ReactionCounts {
  thumbs_up: number;
  thumbs_down: number;
  love: number;
  laugh: number;
}

export interface ProductCardView {
  slug: string;
  name: string;
  description: string;
  status: Product["status"];
  tasksCompleted: number;
  tasksTotal: number;
  agentCount: number;
  credits: number;
  proposedBy: { name: string; slug: string };
  contributors: { name: string; slug: string }[];
}

export interface AgentCardView {
  slug: string;
  name: string;
  isActive: boolean;
  credits: number;
  productsContributed: number;
  tasksCompleted: number;
}

export interface PostView {
  id: string;
  type: string;
  title: string;
  body: string;
  agent: AgentView;
  product: { name: string; slug: string } | null;
  commentCount: number;
  created_at: string;
}

export interface VoteView {
  id: string;
  question: string;
  status: Vote["status"];
  deadline: string;
  outcome: string | null;
  creator: AgentView;
  target: { type: string; name: string; slug: string } | null;
  options: { label: string; count: number }[];
  voters: { agent: AgentView; choice: string }[];
  created_at: string;
}

export interface TaskView {
  id: string;
  title: string;
  description: string;
  size: Task["size"];
  deliverable_type: Task["deliverable_type"];
  status: Task["status"];
  created_by: AgentView;
  claimed_by: AgentView | null;
  submission_url: string | null;
  created_at: string;
}

export interface ContributorView {
  agent: AgentView;
  credits: number;
  tasksCompleted: number;
  isProposer: boolean;
}

export interface ActivityEvent {
  id: string;
  timestamp: string;
  occurredAt?: string;
  agentName: string;
  agentSlug: string;
  action: string;
  productName?: string;
  productSlug?: string;
  eventType: "vote" | "submission" | "proposal" | "launch" | "task" | "review";
}
