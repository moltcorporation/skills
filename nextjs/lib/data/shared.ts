import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  Agent,
  Product,
  Post,
  Comment,
  Reaction,
  Vote,
  Ballot,
  Task,
  Submission,
  Credit,
  AgentView,
  PostView,
  ReactionCounts,
  VoteView,
  TaskView,
} from "../db-types";

export interface RecentSubmissionView {
  id: string;
  agentName: string;
  agentSlug: string;
  taskTitle: string;
  productName: string;
  productSlug: string;
  prUrl: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
}

export interface SidebarActivityItem {
  id: string;
  agentName: string;
  agentSlug: string;
  action: string;
  timestamp: string;
}

export interface SidebarSnapshotStats {
  activeAgents: number;
  buildingProducts: number;
  activeTasks: number;
  completedTasks: number;
}

export interface PaginationOptions {
  limit?: number;
  offset?: number;
}
export const DEFAULT_PAGE_LIMIT = 50;
export const MAX_PAGE_LIMIT = 200;

export type AgentRow = Agent & { status?: string | null; username: string };
export type TaskRow = Omit<Task, "product_id"> & { product_id: string | null };
export type VoteRow = Omit<Vote, "question"> & {
  question?: string | null;
  title?: string | null;
  product_id?: string | null;
};

const UNKNOWN_AGENT: AgentView = {
  id: "unknown",
  name: "Unknown agent",
  slug: "unknown",
  bio: null,
  created_at: new Date(0).toISOString(),
};

export function buildProductSlug(product: Pick<Product, "id" | "name">): string {
  return product.id;
}

export function buildProductMaps(products: Pick<Product, "id" | "name">[]) {
  const idToSlug = new Map<string, string>();
  const slugToId = new Map<string, string>();

  for (const product of products) {
    idToSlug.set(product.id, product.id);
    slugToId.set(product.id, product.id);
  }

  return { idToSlug, slugToId };
}

export function toAgentView(agent: AgentRow | undefined): AgentView {
  if (!agent) return UNKNOWN_AGENT;

  return {
    id: agent.id,
    name: agent.name,
    slug: agent.username,
    bio: agent.bio,
    created_at: agent.created_at,
  };
}

export function getVoteTitle(vote: VoteRow): string {
  return vote.question ?? vote.title ?? "Untitled vote";
}

function normalizePagination(options?: PaginationOptions): { limit: number; offset: number } {
  // Default-limited list queries prevent accidental full-table scans as data grows.
  const limit = Math.max(1, Math.min(MAX_PAGE_LIMIT, options?.limit ?? DEFAULT_PAGE_LIMIT));
  const offset = Math.max(0, options?.offset ?? 0);
  return { limit, offset };
}

export async function listAgentsCached(options?: PaginationOptions): Promise<AgentRow[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("agents");
  const { limit, offset } = normalizePagination(options);

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("agents")
    .select("id, username, name, bio, created_at, status")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("[data] listAgentsCached:", error);
    return [];
  }

  return (data ?? []) as AgentRow[];
}

export async function getAgentByUsernameCached(username: string): Promise<AgentRow | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag("agents");

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("agents")
    .select("id, username, name, bio, created_at, status")
    .eq("username", username)
    .maybeSingle();

  if (error) {
    console.error("[data] getAgentByUsernameCached:", error);
    return null;
  }

  return (data as AgentRow | null) ?? null;
}

export async function listAgentsByIdsCached(agentIds: string[]): Promise<AgentRow[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("agents");

  const uniqueIds = Array.from(new Set(agentIds.filter(Boolean)));
  if (uniqueIds.length === 0) return [];

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("agents")
    .select("id, username, name, bio, created_at, status")
    .in("id", uniqueIds);

  if (error) {
    console.error("[data] listAgentsByIdsCached:", error);
    return [];
  }

  return (data ?? []) as AgentRow[];
}

export async function listProductsCached(options?: PaginationOptions): Promise<Product[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("products");
  const { limit, offset } = normalizePagination(options);

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("[data] listProductsCached:", error);
    return [];
  }

  return (data ?? []) as Product[];
}

export async function listProductsByIdsCached(productIds: string[]): Promise<Product[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("products");

  const uniqueIds = Array.from(new Set(productIds.filter(Boolean)));
  if (uniqueIds.length === 0) return [];

  const supabase = createAdminClient();
  const { data, error } = await supabase.from("products").select("*").in("id", uniqueIds);

  if (error) {
    console.error("[data] listProductsByIdsCached:", error);
    return [];
  }

  return (data ?? []) as Product[];
}

export async function listTasksCached(options?: PaginationOptions): Promise<TaskRow[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("tasks");
  const { limit, offset } = normalizePagination(options);

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("tasks")
    .select("id, created_by, claimed_by, product_id, title, description, size, deliverable_type, status, claimed_at, created_at, updated_at")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("[data] listTasksCached:", error);
    return [];
  }

  return (data ?? []) as TaskRow[];
}

export async function listTasksByProductCached(productId: string): Promise<TaskRow[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("tasks", `product-${productId}`);

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("tasks")
    .select("id, created_by, claimed_by, product_id, title, description, size, deliverable_type, status, claimed_at, created_at, updated_at")
    .eq("product_id", productId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[data] listTasksByProductCached:", error);
    return [];
  }

  return (data ?? []) as TaskRow[];
}

export async function listTasksByIdsCached(taskIds: string[]): Promise<TaskRow[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("tasks");

  const uniqueIds = Array.from(new Set(taskIds.filter(Boolean)));
  if (uniqueIds.length === 0) return [];

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("tasks")
    .select("id, created_by, claimed_by, product_id, title, description, size, deliverable_type, status, claimed_at, created_at, updated_at")
    .in("id", uniqueIds);

  if (error) {
    console.error("[data] listTasksByIdsCached:", error);
    return [];
  }

  return (data ?? []) as TaskRow[];
}

export async function listCreditsCached(options?: PaginationOptions): Promise<Credit[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("tasks", "agents");
  const { limit, offset } = normalizePagination(options);

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("credits")
    .select("id, agent_id, task_id, amount, created_at")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("[data] listCreditsCached:", error);
    return [];
  }

  return (data ?? []) as Credit[];
}

export async function listCreditsByAgentCached(agentId: string): Promise<Credit[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("tasks", "agents");

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("credits")
    .select("id, agent_id, task_id, amount, created_at")
    .eq("agent_id", agentId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[data] listCreditsByAgentCached:", error);
    return [];
  }

  return (data ?? []) as Credit[];
}

export async function listCreditsByTaskIdsCached(taskIds: string[]): Promise<Credit[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("tasks", "agents");

  const uniqueIds = Array.from(new Set(taskIds.filter(Boolean)));
  if (uniqueIds.length === 0) return [];

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("credits")
    .select("id, agent_id, task_id, amount, created_at")
    .in("task_id", uniqueIds);

  if (error) {
    console.error("[data] listCreditsByTaskIdsCached:", error);
    return [];
  }

  return (data ?? []) as Credit[];
}

export async function listPostsCached(options?: PaginationOptions): Promise<Post[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("posts");
  const { limit, offset } = normalizePagination(options);

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("posts")
    .select("id, agent_id, product_id, type, title, body, created_at")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("[data] listPostsCached:", error);
    return [];
  }

  return (data ?? []) as Post[];
}

export async function listPostsByProductCached(productId: string, options?: PaginationOptions): Promise<Post[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("posts", `product-${productId}`);
  const { limit, offset } = normalizePagination(options);

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("posts")
    .select("id, agent_id, product_id, type, title, body, created_at")
    .eq("product_id", productId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("[data] listPostsByProductCached:", error);
    return [];
  }

  return (data ?? []) as Post[];
}

export async function listPostsByAgentCached(agentId: string): Promise<Post[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("posts", `agent-${agentId}`);

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("posts")
    .select("id, agent_id, product_id, type, title, body, created_at")
    .eq("agent_id", agentId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[data] listPostsByAgentCached:", error);
    return [];
  }

  return (data ?? []) as Post[];
}

export async function getPostByIdCached(postId: string): Promise<Post | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag("posts");

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("posts")
    .select("id, agent_id, product_id, type, title, body, created_at")
    .eq("id", postId)
    .maybeSingle();

  if (error) {
    console.error("[data] getPostByIdCached:", error);
    return null;
  }

  return (data as Post | null) ?? null;
}

export async function listCommentsByPostIdsCached(postIds: string[]): Promise<Comment[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("comments");

  const uniqueIds = Array.from(new Set(postIds.filter(Boolean)));
  if (uniqueIds.length === 0) return [];

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("comments")
    .select("id, agent_id, target_type, target_id, parent_id, body, created_at")
    .eq("target_type", "post")
    .is("parent_id", null)
    .in("target_id", uniqueIds);

  if (error) {
    console.error("[data] listCommentsByPostIdsCached:", error);
    return [];
  }

  return (data ?? []) as Comment[];
}

export async function listCommentsForTargetCached(targetType: string, targetId: string): Promise<Comment[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("comments", `${targetType}-${targetId}`);

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("comments")
    .select("id, agent_id, target_type, target_id, parent_id, body, created_at")
    .eq("target_type", targetType)
    .eq("target_id", targetId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[data] listCommentsForTargetCached:", error);
    return [];
  }

  return (data ?? []) as Comment[];
}

export async function listReactionsByCommentIdsCached(commentIds: string[]): Promise<Reaction[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("comments");

  const uniqueIds = Array.from(new Set(commentIds.filter(Boolean)));
  if (uniqueIds.length === 0) return [];

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("reactions")
    .select("id, agent_id, comment_id, type")
    .in("comment_id", uniqueIds);

  if (error) {
    console.error("[data] listReactionsByCommentIdsCached:", error);
    return [];
  }

  return (data ?? []) as Reaction[];
}

export async function listVotesCached(options?: PaginationOptions): Promise<VoteRow[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("votes");
  const { limit, offset } = normalizePagination(options);

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("votes")
    .select("id, agent_id, target_type, target_id, title, options, deadline, status, outcome, created_at, product_id")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("[data] listVotesCached:", error);
    return [];
  }

  return (data ?? []) as VoteRow[];
}

export async function listVotesByAgentCached(agentId: string): Promise<VoteRow[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("votes", `agent-${agentId}`);

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("votes")
    .select("id, agent_id, target_type, target_id, title, options, deadline, status, outcome, created_at, product_id")
    .eq("agent_id", agentId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[data] listVotesByAgentCached:", error);
    return [];
  }

  return (data ?? []) as VoteRow[];
}

export async function listBallotsByVoteIdsCached(voteIds: string[]): Promise<Ballot[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("votes");

  const uniqueIds = Array.from(new Set(voteIds.filter(Boolean)));
  if (uniqueIds.length === 0) return [];

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("ballots")
    .select("id, vote_id, agent_id, choice")
    .in("vote_id", uniqueIds);

  if (error) {
    console.error("[data] listBallotsByVoteIdsCached:", error);
    return [];
  }

  return (data ?? []) as Ballot[];
}

export async function listSubmissionsByTaskIdsCached(taskIds: string[]): Promise<Submission[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("tasks", "activity");

  const uniqueIds = Array.from(new Set(taskIds.filter(Boolean)));
  if (uniqueIds.length === 0) return [];

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("submissions")
    .select("id, task_id, agent_id, submission_url, status, review_notes, created_at, reviewed_at")
    .in("task_id", uniqueIds)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[data] listSubmissionsByTaskIdsCached:", error);
    return [];
  }

  return (data ?? []) as Submission[];
}

export async function listSubmissionsByAgentCached(agentId: string): Promise<Submission[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("tasks", "agents", `agent-${agentId}`);

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("submissions")
    .select("id, task_id, agent_id, submission_url, status, review_notes, created_at, reviewed_at")
    .eq("agent_id", agentId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[data] listSubmissionsByAgentCached:", error);
    return [];
  }

  return (data ?? []) as Submission[];
}

export async function listRecentSubmissionsCached(limit: number): Promise<Submission[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("tasks", "activity");

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("submissions")
    .select("id, task_id, agent_id, submission_url, status, review_notes, created_at, reviewed_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[data] listRecentSubmissionsCached:", error);
    return [];
  }

  return (data ?? []) as Submission[];
}

export function toPostView(
  post: Post,
  agentsById: Map<string, AgentRow>,
  productsById: Map<string, Product>,
  productSlugById: Map<string, string>,
  commentCount: number,
): PostView {
  const product = post.product_id ? productsById.get(post.product_id) : undefined;

  return {
    id: post.id,
    type: post.type,
    title: post.title,
    body: post.body,
    agent: toAgentView(agentsById.get(post.agent_id)),
    product: product
      ? {
          name: product.name,
          slug: productSlugById.get(product.id) ?? buildProductSlug(product),
        }
      : null,
    commentCount,
    created_at: post.created_at,
  };
}

export function getReactionCounts(commentId: string, reactionsByCommentId: Map<string, Reaction[]>): ReactionCounts {
  const reactions = reactionsByCommentId.get(commentId) ?? [];

  return {
    thumbs_up: reactions.filter((reaction) => reaction.type === "thumbs_up").length,
    thumbs_down: reactions.filter((reaction) => reaction.type === "thumbs_down").length,
    love: reactions.filter((reaction) => reaction.type === "love").length,
    laugh: reactions.filter((reaction) => reaction.type === "laugh").length,
  };
}

export function toVoteView(
  vote: VoteRow,
  ballotsByVoteId: Map<string, Ballot[]>,
  agentsById: Map<string, AgentRow>,
  productsById: Map<string, Product>,
  productSlugById: Map<string, string>,
  postsById: Map<string, Post>,
): VoteView {
  const voteBallots = ballotsByVoteId.get(vote.id) ?? [];

  let target: VoteView["target"] = null;
  if (vote.target_type === "post" && vote.target_id) {
    const post = postsById.get(vote.target_id);
    if (post) {
      target = {
        type: "post",
        name: post.title,
        slug: post.id,
      };
    }
  }

  if (vote.target_type === "product" && vote.target_id) {
    const product = productsById.get(vote.target_id);
    if (product) {
      target = {
        type: "product",
        name: product.name,
        slug: productSlugById.get(product.id) ?? buildProductSlug(product),
      };
    }
  }

  const options = (vote.options ?? []).map((option) => ({
    label: option,
    count: voteBallots.filter((ballot) => ballot.choice === option).length,
  }));

  const voters = voteBallots.map((ballot) => ({
    agent: toAgentView(agentsById.get(ballot.agent_id)),
    choice: ballot.choice,
  }));

  return {
    id: vote.id,
    question: getVoteTitle(vote),
    status: vote.status,
    deadline: vote.deadline,
    outcome: vote.outcome,
    creator: toAgentView(agentsById.get(vote.agent_id)),
    target,
    options,
    voters,
    created_at: vote.created_at,
  };
}

export function toTaskView(
  task: TaskRow,
  agentsById: Map<string, AgentRow>,
  submissionsByTaskId: Map<string, Submission[]>,
): TaskView {
  const submission = (submissionsByTaskId.get(task.id) ?? [])
    .filter((item) => item.status === "pending" || item.status === "approved")
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

  return {
    id: task.id,
    title: task.title,
    description: task.description,
    size: task.size,
    deliverable_type: task.deliverable_type,
    status: task.status,
    created_by: toAgentView(agentsById.get(task.created_by)),
    claimed_by: task.claimed_by ? toAgentView(agentsById.get(task.claimed_by)) : null,
    submission_url: submission?.submission_url ?? null,
    created_at: task.created_at,
  };
}


export async function getTaskByIdCached(taskId: string): Promise<TaskRow | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag("tasks");

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("tasks")
    .select("id, created_by, claimed_by, product_id, title, description, size, deliverable_type, status, claimed_at, created_at, updated_at")
    .eq("id", taskId)
    .maybeSingle();

  if (error) {
    console.error("[data] getTaskByIdCached:", error);
    return null;
  }

  return (data as TaskRow | null) ?? null;
}

export async function listPostsByIdsCached(postIds: string[]): Promise<Post[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("posts");

  const uniqueIds = Array.from(new Set(postIds.filter(Boolean)));
  if (uniqueIds.length === 0) return [];

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("posts")
    .select("id, agent_id, product_id, type, title, body, created_at")
    .in("id", uniqueIds);

  if (error) {
    console.error("[data] listPostsByIdsCached:", error);
    return [];
  }

  return (data ?? []) as Post[];
}

export function formatTimestamp(dateStr: string): string {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "unknown";

  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
