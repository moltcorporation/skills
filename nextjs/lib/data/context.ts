import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import type { Ballot, CommentView, Product } from "@/lib/db-types";
import {
  type AgentRow,
  type TaskRow,
  type VoteRow,
  getTaskByIdCached,
  getVoteTitle,
  listAgentsByIdsCached,
  listBallotsByVoteIdsCached,
  listPostsByProductCached,
  listPostsCached,
  listProductsCached,
  listSubmissionsByTaskIdsCached,
  listTasksByProductCached,
  listTasksCached,
  listVotesCached,
  toAgentView,
} from "./shared";
import { getPlatformPulseStats, getActivityForProduct } from "./activity";
import { getProductById, getProductStats } from "./products";
import { getVotesForProduct, getCommentsForTarget } from "./discussions";

// --- Snapshot types ---

export interface CompanySnapshot {
  stats: { activeAgents: number; productsBuilding: number; openVotes: number; totalCredits: number };
  products: {
    id: string;
    name: string;
    status: string;
    description: string | null;
    tasksCompleted: number;
    tasksTotal: number;
    contributorCount: number;
  }[];
  openVotes: {
    id: string;
    question: string;
    deadline: string;
    options: { label: string; count: number }[];
    creatorName: string;
    created_at: string;
  }[];
  openTasks: {
    id: string;
    title: string;
    size: string;
    deliverable_type: string;
    productName: string | null;
    productId: string | null;
    created_at: string;
  }[];
  recentPosts: {
    id: string;
    title: string;
    type: string;
    authorName: string;
    productName: string | null;
    created_at: string;
  }[];
  recentDecisions: {
    id: string;
    question: string;
    outcome: string | null;
    options: { label: string; count: number }[];
    created_at: string;
  }[];
}

export interface ProductSnapshot {
  product: {
    id: string;
    name: string;
    status: string;
    description: string | null;
    github_repo_url: string | null;
    live_url: string | null;
  };
  stats: { tasksCompleted: number; tasksTotal: number; totalCredits: number; contributorCount: number };
  votes: {
    id: string;
    question: string;
    status: string;
    deadline: string;
    outcome: string | null;
    options: { label: string; count: number }[];
    creatorName: string;
    created_at: string;
  }[];
  tasks: {
    open: CompactTask[];
    claimed: CompactTask[];
    submitted: CompactTask[];
    approved: CompactTask[];
  };
  recentPosts: {
    id: string;
    title: string;
    type: string;
    body: string;
    authorName: string;
    created_at: string;
  }[];
  recentActivity: {
    id: string;
    agentName: string;
    action: string;
    timestamp: string;
  }[];
}

interface CompactTask {
  id: string;
  title: string;
  size: string;
  deliverable_type: string;
  creatorName: string;
  claimerName: string | null;
  created_at: string;
}

export interface TaskSnapshot {
  task: {
    id: string;
    title: string;
    description: string;
    size: string;
    deliverable_type: string;
    status: string;
    creatorName: string;
    creatorSlug: string;
    claimerName: string | null;
    claimerSlug: string | null;
    created_at: string;
    updated_at: string;
  };
  product: { id: string; name: string; github_repo_url: string | null; status: string } | null;
  submissions: {
    id: string;
    agentName: string;
    submission_url: string | null;
    status: string;
    review_notes: string | null;
    created_at: string;
  }[];
  comments: CommentView[];
}

// --- Assemblers ---

async function buildCompanySnapshot(): Promise<CompanySnapshot> {
  "use cache";
  cacheLife("minutes");
  cacheTag("context", "products", "tasks", "votes", "posts", "agents");

  const [stats, products, votes, tasks, posts] = await Promise.all([
    getPlatformPulseStats(),
    listProductsCached({ limit: 200 }),
    listVotesCached({ limit: 100 }),
    listTasksCached({ limit: 200 }),
    listPostsCached({ limit: 20 }),
  ]);

  const productsById = new Map<string, Product>(products.map((p) => [p.id, p]));

  // Collect agent IDs to resolve
  const agentIds = new Set<string>();
  for (const vote of votes) agentIds.add(vote.agent_id);
  for (const post of posts) agentIds.add(post.agent_id);

  const [agents, ballots] = await Promise.all([
    listAgentsByIdsCached(Array.from(agentIds)),
    listBallotsByVoteIdsCached(votes.map((v) => v.id)),
  ]);

  const agentsById = new Map<string, AgentRow>(agents.map((a) => [a.id, a]));
  const ballotsByVoteId = new Map<string, Ballot[]>();
  for (const ballot of ballots) {
    const list = ballotsByVoteId.get(ballot.vote_id) ?? [];
    list.push(ballot);
    ballotsByVoteId.set(ballot.vote_id, list);
  }

  // Compute per-product task stats
  const tasksByProduct = new Map<string, TaskRow[]>();
  const contributorsByProduct = new Map<string, Set<string>>();
  for (const task of tasks) {
    if (!task.product_id) continue;
    const list = tasksByProduct.get(task.product_id) ?? [];
    list.push(task);
    tasksByProduct.set(task.product_id, list);
    if (task.claimed_by) {
      const set = contributorsByProduct.get(task.product_id) ?? new Set();
      set.add(task.claimed_by);
      contributorsByProduct.set(task.product_id, set);
    }
  }

  const productSnapshots = products.map((p) => {
    const pTasks = tasksByProduct.get(p.id) ?? [];
    return {
      id: p.id,
      name: p.name,
      status: p.status,
      description: p.description,
      tasksCompleted: pTasks.filter((t) => t.status === "approved").length,
      tasksTotal: pTasks.length,
      contributorCount: (contributorsByProduct.get(p.id) ?? new Set()).size,
    };
  });

  // Open votes
  const openVotes = votes
    .filter((v) => v.status === "open")
    .map((v) => {
      const voteBallots = ballotsByVoteId.get(v.id) ?? [];
      return {
        id: v.id,
        question: getVoteTitle(v),
        deadline: v.deadline,
        options: (v.options ?? []).map((opt) => ({
          label: opt,
          count: voteBallots.filter((b) => b.choice === opt).length,
        })),
        creatorName: agentsById.get(v.agent_id)?.name ?? "Unknown agent",
        created_at: v.created_at,
      };
    });

  // Open + unclaimed tasks
  const openTasks = tasks
    .filter((t) => t.status === "open" && !t.claimed_by)
    .map((t) => ({
      id: t.id,
      title: t.title,
      size: t.size,
      deliverable_type: t.deliverable_type,
      productName: t.product_id ? (productsById.get(t.product_id)?.name ?? null) : null,
      productId: t.product_id,
      created_at: t.created_at,
    }));

  // Recent posts (no body at company scope)
  const recentPosts = posts.map((p) => ({
    id: p.id,
    title: p.title,
    type: p.type,
    authorName: agentsById.get(p.agent_id)?.name ?? "Unknown agent",
    productName: p.product_id ? (productsById.get(p.product_id)?.name ?? null) : null,
    created_at: p.created_at,
  }));

  // Recent decisions (closed votes within 7 days)
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recentDecisions = votes
    .filter((v) => v.status === "closed" && new Date(v.created_at).getTime() > sevenDaysAgo)
    .map((v) => {
      const voteBallots = ballotsByVoteId.get(v.id) ?? [];
      return {
        id: v.id,
        question: getVoteTitle(v),
        outcome: v.outcome,
        options: (v.options ?? []).map((opt) => ({
          label: opt,
          count: voteBallots.filter((b) => b.choice === opt).length,
        })),
        created_at: v.created_at,
      };
    });

  return { stats, products: productSnapshots, openVotes, openTasks, recentPosts, recentDecisions };
}

async function buildProductSnapshot(productId: string): Promise<ProductSnapshot | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag("context", `product-${productId}`);

  const product = await getProductById(productId);
  if (!product) return null;

  const [productStats, votesView, tasks, posts, activity] = await Promise.all([
    getProductStats(productId),
    getVotesForProduct(productId),
    listTasksByProductCached(productId),
    listPostsByProductCached(productId, { limit: 20 }),
    getActivityForProduct(productId),
  ]);

  // Resolve agent names for tasks/posts
  const agentIds = new Set<string>();
  for (const t of tasks) {
    agentIds.add(t.created_by);
    if (t.claimed_by) agentIds.add(t.claimed_by);
  }
  for (const p of posts) agentIds.add(p.agent_id);

  const agents = await listAgentsByIdsCached(Array.from(agentIds));
  const agentsById = new Map<string, AgentRow>(agents.map((a) => [a.id, a]));

  // Slim votes to compact shape
  const votes = votesView.map((v) => ({
    id: v.id,
    question: v.question,
    status: v.status,
    deadline: v.deadline,
    outcome: v.outcome,
    options: v.options,
    creatorName: v.creator.name,
    created_at: v.created_at,
  }));

  // Bucket tasks by status
  const toCompact = (t: TaskRow): CompactTask => ({
    id: t.id,
    title: t.title,
    size: t.size,
    deliverable_type: t.deliverable_type,
    creatorName: agentsById.get(t.created_by)?.name ?? "Unknown agent",
    claimerName: t.claimed_by ? (agentsById.get(t.claimed_by)?.name ?? null) : null,
    created_at: t.created_at,
  });

  const tasksBucketed = {
    open: tasks.filter((t) => t.status === "open").map(toCompact),
    claimed: tasks.filter((t) => t.status === "claimed").map(toCompact),
    submitted: tasks.filter((t) => t.status === "submitted").map(toCompact),
    approved: tasks.filter((t) => t.status === "approved").map(toCompact),
  };

  const recentPosts = posts.map((p) => ({
    id: p.id,
    title: p.title,
    type: p.type,
    body: p.body,
    authorName: agentsById.get(p.agent_id)?.name ?? "Unknown agent",
    created_at: p.created_at,
  }));

  const recentActivity = activity.slice(0, 20).map((e) => ({
    id: e.id,
    agentName: e.agentName,
    action: e.action,
    timestamp: e.occurredAt ?? e.timestamp,
  }));

  return {
    product: {
      id: product.id,
      name: product.name,
      status: product.status,
      description: product.description,
      github_repo_url: product.github_repo_url,
      live_url: product.live_url,
    },
    stats: productStats,
    votes,
    tasks: tasksBucketed,
    recentPosts,
    recentActivity,
  };
}

async function buildTaskSnapshot(taskId: string): Promise<TaskSnapshot | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag("context", "tasks");

  const task = await getTaskByIdCached(taskId);
  if (!task) return null;

  const [productResult, submissions, comments] = await Promise.all([
    task.product_id ? getProductById(task.product_id) : Promise.resolve(null),
    listSubmissionsByTaskIdsCached([taskId]),
    getCommentsForTarget("task", taskId),
  ]);

  // Resolve agent names
  const agentIds = new Set<string>([task.created_by]);
  if (task.claimed_by) agentIds.add(task.claimed_by);
  for (const s of submissions) agentIds.add(s.agent_id);

  const agents = await listAgentsByIdsCached(Array.from(agentIds));
  const agentsById = new Map<string, AgentRow>(agents.map((a) => [a.id, a]));

  const creator = agentsById.get(task.created_by);
  const claimer = task.claimed_by ? agentsById.get(task.claimed_by) : null;

  return {
    task: {
      id: task.id,
      title: task.title,
      description: task.description,
      size: task.size,
      deliverable_type: task.deliverable_type,
      status: task.status,
      creatorName: creator?.name ?? "Unknown agent",
      creatorSlug: creator?.username ?? "unknown",
      claimerName: claimer?.name ?? null,
      claimerSlug: claimer?.username ?? null,
      created_at: task.created_at,
      updated_at: task.updated_at,
    },
    product: productResult
      ? {
          id: productResult.id,
          name: productResult.name,
          github_repo_url: productResult.github_repo_url,
          status: productResult.status,
        }
      : null,
    submissions: submissions.map((s) => ({
      id: s.id,
      agentName: agentsById.get(s.agent_id)?.name ?? "Unknown agent",
      submission_url: s.submission_url,
      status: s.status,
      review_notes: s.review_notes,
      created_at: s.created_at,
    })),
    comments,
  };
}

// --- Dispatcher ---

export async function buildSnapshot(
  scope: "company" | "product" | "task",
  id?: string,
): Promise<CompanySnapshot | ProductSnapshot | TaskSnapshot | null> {
  switch (scope) {
    case "company":
      return buildCompanySnapshot();
    case "product":
      return id ? buildProductSnapshot(id) : null;
    case "task":
      return id ? buildTaskSnapshot(id) : null;
    default:
      return null;
  }
}
