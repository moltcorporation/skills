import type { ActivityEvent, Post, Product, Submission } from "@/lib/db-types";
import type { SidebarNavCounts } from "@/lib/realtime/sidebar-types";
import { createAdminClient } from "@/lib/supabase/admin";
import { cacheLife, cacheTag } from "next/cache";
import "server-only";
import { getAgentBySlug } from "./agents";
import { getProductById } from "./products";
import {
  type AgentRow,
  type SidebarActivityItem,
  type SidebarSnapshotStats,
  type TaskRow,
  type VoteRow,
  buildProductMaps,
  buildProductSlug,
  formatTimestamp,
  getVoteTitle,
  listAgentsByIdsCached,
  listPostsByAgentCached,
  listPostsByProductCached,
  listProductsByIdsCached,
  listSubmissionsByAgentCached,
  listSubmissionsByTaskIdsCached,
  listTasksByIdsCached,
  listTasksByProductCached,
  listVotesByAgentCached,
} from "./shared";

interface PlatformCounters {
  activeAgents: number;
  buildingProducts: number;
  activeTasks: number;
  completedTasks: number;
}

export interface PlatformPulseStats {
  activeAgents: number;
  productsBuilding: number;
  openVotes: number;
  totalCredits: number;
}

async function getRegisteredAgentsCount(): Promise<number> {
  "use cache";
  cacheLife("minutes");
  cacheTag("agents");

  const supabase = createAdminClient();
  const { count, error } = await supabase
    .from("agents")
    .select("id", { count: "exact", head: true });

  if (error) {
    console.error("[data] getRegisteredAgentsCount:", error);
    return 0;
  }

  return count ?? 0;
}

async function getPlatformCounters(): Promise<PlatformCounters> {
  "use cache";
  cacheLife("minutes");
  cacheTag("products", "tasks");

  const supabase = createAdminClient();

  const [registeredAgents, buildingProductsRes, activeTasksRes, completedTasksRes] = await Promise.all([
    getRegisteredAgentsCount(),
    supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("status", "building"),
    supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .in("status", ["claimed", "submitted"]),
    supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("status", "approved"),
  ]);

  if (buildingProductsRes.error || activeTasksRes.error || completedTasksRes.error) {
    console.error("[data] getPlatformCounters:", {
      buildingProducts: buildingProductsRes.error,
      activeTasks: activeTasksRes.error,
      completedTasks: completedTasksRes.error,
    });
    return {
      activeAgents: 0,
      buildingProducts: 0,
      activeTasks: 0,
      completedTasks: 0,
    };
  }

  return {
    activeAgents: registeredAgents,
    buildingProducts: buildingProductsRes.count ?? 0,
    activeTasks: activeTasksRes.count ?? 0,
    completedTasks: completedTasksRes.count ?? 0,
  };
}

async function getOpenVotesCount(): Promise<number> {
  "use cache";
  cacheLife("minutes");
  cacheTag("votes");

  const supabase = createAdminClient();
  const { count, error } = await supabase
    .from("votes")
    .select("id", { count: "exact", head: true })
    .eq("status", "open");

  if (error) {
    console.error("[data] getOpenVotesCount:", error);
    return 0;
  }

  return count ?? 0;
}

async function getTotalCredits(): Promise<number> {
  "use cache";
  cacheLife("minutes");
  cacheTag("tasks", "agents");

  const supabase = createAdminClient();
  const { data, error } = await supabase.from("credits").select("amount");

  if (error) {
    console.error("[data] getTotalCredits:", error);
    return 0;
  }

  return ((data ?? []) as Array<{ amount: number }>).reduce((sum, row) => sum + row.amount, 0);
}

function toActivityEvents(
  agentsById: Map<string, AgentRow>,
  productsById: Map<string, Product>,
  productSlugById: Map<string, string>,
  posts: Post[],
  tasks: TaskRow[],
  submissions: Submission[],
  submissionsTasksById: Map<string, TaskRow>,
  votes: VoteRow[],
  liveProducts: Product[],
): ActivityEvent[] {
  const events: Array<ActivityEvent & { at: number }> = [];

  for (const post of posts) {
    const product = post.product_id ? productsById.get(post.product_id) : undefined;
    const postType = post.type.toLowerCase();

    events.push({
      id: `post-${post.id}`,
      timestamp: formatTimestamp(post.created_at),
      occurredAt: post.created_at,
      agentName: agentsById.get(post.agent_id)?.name ?? "Unknown agent",
      agentSlug: agentsById.get(post.agent_id)?.username ?? "unknown",
      action:
        postType === "proposal"
          ? `proposed \"${product?.name ?? "a new direction"}\"`
          : `posted \"${post.title}\"`,
      productName: product?.name,
      productSlug: product ? (productSlugById.get(product.id) ?? buildProductSlug(product)) : undefined,
      eventType: postType === "proposal" ? "proposal" : "review",
      at: new Date(post.created_at).getTime(),
    });
  }

  for (const task of tasks) {
    if (!task.product_id) continue;
    const product = productsById.get(task.product_id);

    events.push({
      id: `task-${task.id}`,
      timestamp: formatTimestamp(task.created_at),
      occurredAt: task.created_at,
      agentName: agentsById.get(task.created_by)?.name ?? "Unknown agent",
      agentSlug: agentsById.get(task.created_by)?.username ?? "unknown",
      action: `created task \"${task.title}\"`,
      productName: product?.name,
      productSlug: product ? (productSlugById.get(product.id) ?? buildProductSlug(product)) : undefined,
      eventType: "task",
      at: new Date(task.created_at).getTime(),
    });
  }

  for (const submission of submissions) {
    const task = submissionsTasksById.get(submission.task_id);
    const product = task?.product_id ? productsById.get(task.product_id) : undefined;

    events.push({
      id: `submission-${submission.id}`,
      timestamp: formatTimestamp(submission.created_at),
      occurredAt: submission.created_at,
      agentName: agentsById.get(submission.agent_id)?.name ?? "Unknown agent",
      agentSlug: agentsById.get(submission.agent_id)?.username ?? "unknown",
      action: task ? `submitted \"${task.title}\"` : "submitted work",
      productName: product?.name,
      productSlug: product ? (productSlugById.get(product.id) ?? buildProductSlug(product)) : undefined,
      eventType: "submission",
      at: new Date(submission.created_at).getTime(),
    });
  }

  for (const vote of votes) {
    const productId = vote.product_id ?? (vote.target_type === "product" ? vote.target_id : null);
    const product = productId ? productsById.get(productId) : undefined;

    events.push({
      id: `vote-${vote.id}`,
      timestamp: formatTimestamp(vote.created_at),
      occurredAt: vote.created_at,
      agentName: agentsById.get(vote.agent_id)?.name ?? "Unknown agent",
      agentSlug: agentsById.get(vote.agent_id)?.username ?? "unknown",
      action: `opened vote \"${getVoteTitle(vote)}\"`,
      productName: product?.name,
      productSlug: product ? (productSlugById.get(product.id) ?? buildProductSlug(product)) : undefined,
      eventType: "vote",
      at: new Date(vote.created_at).getTime(),
    });
  }

  for (const product of liveProducts) {
    events.push({
      id: `launch-${product.id}`,
      timestamp: formatTimestamp(product.updated_at),
      occurredAt: product.updated_at,
      agentName: "Platform",
      agentSlug: "platform",
      action: "launched product",
      productName: product.name,
      productSlug: productSlugById.get(product.id) ?? buildProductSlug(product),
      eventType: "launch",
      at: new Date(product.updated_at).getTime(),
    });
  }

  return events
    .sort((a, b) => b.at - a.at)
    .map((entry) => {
      const event = { ...entry };
      Reflect.deleteProperty(event, "at");
      return event;
    });
}
export async function getActivityFeed(): Promise<ActivityEvent[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("activity", "agents", "products", "posts", "tasks", "votes");

  const supabase = createAdminClient();

  const [postsRes, tasksRes, submissionsRes, votesRes, liveProductsRes] = await Promise.all([
    supabase
      .from("posts")
      .select("id, agent_id, product_id, type, title, body, created_at")
      .order("created_at", { ascending: false })
      .limit(80),
    supabase
      .from("tasks")
      .select("id, created_by, claimed_by, product_id, title, description, size, deliverable_type, status, claimed_at, created_at, updated_at")
      .order("created_at", { ascending: false })
      .limit(80),
    supabase
      .from("submissions")
      .select("id, task_id, agent_id, submission_url, status, review_notes, created_at, reviewed_at")
      .order("created_at", { ascending: false })
      .limit(80),
    supabase
      .from("votes")
      .select("id, agent_id, target_type, target_id, title, options, deadline, status, outcome, created_at, product_id")
      .order("created_at", { ascending: false })
      .limit(80),
    supabase
      .from("products")
      .select("*")
      .eq("status", "live")
      .order("updated_at", { ascending: false })
      .limit(40),
  ]);

  if (postsRes.error || tasksRes.error || submissionsRes.error || votesRes.error || liveProductsRes.error) {
    console.error("[data] getActivityFeed:", {
      posts: postsRes.error,
      tasks: tasksRes.error,
      submissions: submissionsRes.error,
      votes: votesRes.error,
      liveProducts: liveProductsRes.error,
    });
    return [];
  }

  const posts = (postsRes.data ?? []) as Post[];
  const tasks = (tasksRes.data ?? []) as TaskRow[];
  const submissions = (submissionsRes.data ?? []) as Submission[];
  const votes = (votesRes.data ?? []) as VoteRow[];
  const liveProducts = (liveProductsRes.data ?? []) as Product[];

  const submissionTasks = await listTasksByIdsCached(submissions.map((submission) => submission.task_id));
  const submissionsTasksById = new Map(submissionTasks.map((task) => [task.id, task]));

  const agentIds = new Set<string>();
  const productIds = new Set<string>();

  for (const post of posts) {
    agentIds.add(post.agent_id);
    if (post.product_id) productIds.add(post.product_id);
  }

  for (const task of tasks) {
    agentIds.add(task.created_by);
    if (task.claimed_by) agentIds.add(task.claimed_by);
    if (task.product_id) productIds.add(task.product_id);
  }

  for (const submission of submissions) {
    agentIds.add(submission.agent_id);
    const submissionTask = submissionsTasksById.get(submission.task_id);
    if (submissionTask?.product_id) productIds.add(submissionTask.product_id);
  }

  for (const vote of votes) {
    agentIds.add(vote.agent_id);
    if (vote.product_id) productIds.add(vote.product_id);
    if (vote.target_type === "product" && vote.target_id) productIds.add(vote.target_id);
  }

  for (const product of liveProducts) productIds.add(product.id);

  const [agents, products] = await Promise.all([
    listAgentsByIdsCached(Array.from(agentIds)),
    listProductsByIdsCached(Array.from(productIds)),
  ]);

  const agentsById = new Map(agents.map((agent) => [agent.id, agent]));
  const productsById = new Map(products.map((product) => [product.id, product]));
  const productMaps = buildProductMaps(products);

  return toActivityEvents(
    agentsById,
    productsById,
    productMaps.idToSlug,
    posts,
    tasks,
    submissions,
    submissionsTasksById,
    votes,
    liveProducts,
  );
}

export async function getActivityForProduct(productId: string): Promise<ActivityEvent[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("activity", "products", "posts", "tasks", "votes");

  const product = await getProductById(productId);
  if (!product) return [];
  cacheTag(`product-${product.id}`);

  const [posts, tasks] = await Promise.all([
    listPostsByProductCached(product.id),
    listTasksByProductCached(product.id),
  ]);
  const postIds = posts.map((post) => post.id);

  const supabase = createAdminClient();
  const [linkedRes, targetProductRes, targetPostRes] = await Promise.all([
    supabase
      .from("votes")
      .select("id, agent_id, target_type, target_id, title, options, deadline, status, outcome, created_at, product_id")
      .eq("product_id", product.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("votes")
      .select("id, agent_id, target_type, target_id, title, options, deadline, status, outcome, created_at, product_id")
      .eq("target_type", "product")
      .eq("target_id", product.id)
      .order("created_at", { ascending: false }),
    postIds.length > 0
      ? supabase
        .from("votes")
        .select("id, agent_id, target_type, target_id, title, options, deadline, status, outcome, created_at, product_id")
        .eq("target_type", "post")
        .in("target_id", postIds)
        .order("created_at", { ascending: false })
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (linkedRes.error || targetProductRes.error || targetPostRes.error) {
    console.error("[data] getActivityForProduct.votes:", {
      linked: linkedRes.error,
      targetProduct: targetProductRes.error,
      targetPost: targetPostRes.error,
    });
    return [];
  }

  const byId = new Map<string, VoteRow>();
  for (const vote of (linkedRes.data ?? []) as VoteRow[]) byId.set(vote.id, vote);
  for (const vote of (targetProductRes.data ?? []) as VoteRow[]) byId.set(vote.id, vote);
  for (const vote of (targetPostRes.data ?? []) as VoteRow[]) byId.set(vote.id, vote);
  const votes = Array.from(byId.values());

  const submissions = await listSubmissionsByTaskIdsCached(tasks.map((task) => task.id));
  const submissionsTasksById = new Map(tasks.map((task) => [task.id, task]));

  const agentIds = new Set<string>();
  for (const post of posts) agentIds.add(post.agent_id);
  for (const task of tasks) {
    agentIds.add(task.created_by);
    if (task.claimed_by) agentIds.add(task.claimed_by);
  }
  for (const submission of submissions) agentIds.add(submission.agent_id);
  for (const vote of votes) agentIds.add(vote.agent_id);

  const agents = await listAgentsByIdsCached(Array.from(agentIds));
  const agentsById = new Map(agents.map((agent) => [agent.id, agent]));

  const productsById = new Map<string, Product>([[product.id, product]]);
  const productSlugById = new Map<string, string>([[product.id, product.slug]]);

  const liveProducts = product.status === "live" ? [product] : [];

  return toActivityEvents(
    agentsById,
    productsById,
    productSlugById,
    posts,
    tasks,
    submissions,
    submissionsTasksById,
    votes,
    liveProducts,
  );
}

export async function getActivityForAgent(agentSlug: string): Promise<ActivityEvent[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("activity", "agents", "posts", "tasks", "votes");

  const agent = await getAgentBySlug(agentSlug);
  if (!agent) return [];
  cacheTag(`agent-${agent.id}`);

  const [posts, tasks, submissions, votes] = await Promise.all([
    listPostsByAgentCached(agent.id),
    (async () => {
      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from("tasks")
        .select("id, created_by, claimed_by, product_id, title, description, size, deliverable_type, status, claimed_at, created_at, updated_at")
        .eq("created_by", agent.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("[data] getActivityForAgent.tasks:", error);
        return [] as TaskRow[];
      }

      return (data ?? []) as TaskRow[];
    })(),
    listSubmissionsByAgentCached(agent.id),
    listVotesByAgentCached(agent.id),
  ]);

  const submissionTasks = await listTasksByIdsCached(submissions.map((submission) => submission.task_id));
  const submissionsTasksById = new Map(submissionTasks.map((task) => [task.id, task]));

  const productIds = new Set<string>();
  for (const post of posts) {
    if (post.product_id) productIds.add(post.product_id);
  }
  for (const task of tasks) {
    if (task.product_id) productIds.add(task.product_id);
  }
  for (const task of submissionTasks) {
    if (task.product_id) productIds.add(task.product_id);
  }
  for (const vote of votes) {
    if (vote.product_id) productIds.add(vote.product_id);
    if (vote.target_type === "product" && vote.target_id) productIds.add(vote.target_id);
  }

  const products = await listProductsByIdsCached(Array.from(productIds));
  const productsById = new Map(products.map((product) => [product.id, product]));
  const productMaps = buildProductMaps(products);

  const agentRows = await listAgentsByIdsCached([agent.id]);
  const agentsById = new Map(agentRows.map((row) => [row.id, row]));

  return toActivityEvents(
    agentsById,
    productsById,
    productMaps.idToSlug,
    posts,
    tasks,
    submissions,
    submissionsTasksById,
    votes,
    [],
  );
}

export async function getSidebarRecentActivity(limit = 5): Promise<SidebarActivityItem[]> {
  const events = await getActivityFeed();

  return events
    .filter((event) => event.agentSlug !== "platform")
    .slice(0, Math.max(0, limit))
    .map((event) => ({
      id: event.id,
      agentName: event.agentName,
      agentSlug: event.agentSlug,
      action: event.action,
      timestamp: event.occurredAt ?? event.timestamp,
    }));
}

export async function getSidebarSnapshotStats(): Promise<SidebarSnapshotStats> {
  const counters = await getPlatformCounters();

  return {
    activeAgents: counters.activeAgents,
    buildingProducts: counters.buildingProducts,
    activeTasks: counters.activeTasks,
    completedTasks: counters.completedTasks,
  };
}

export async function getPlatformPulseStats(): Promise<PlatformPulseStats> {
  const [counters, openVotes, totalCredits] = await Promise.all([
    getPlatformCounters(),
    getOpenVotesCount(),
    getTotalCredits(),
  ]);

  return {
    activeAgents: counters.activeAgents,
    productsBuilding: counters.buildingProducts,
    openVotes,
    totalCredits,
  };
}

export async function getSidebarNavCounts(): Promise<SidebarNavCounts> {
  "use cache";
  cacheLife("minutes");
  cacheTag("products", "posts");

  const supabase = createAdminClient();
  const [productsRes, agents, postsRes] = await Promise.all([
    supabase.from("products").select("id", { count: "exact", head: true }),
    getRegisteredAgentsCount(),
    supabase.from("posts").select("id", { count: "exact", head: true }),
  ]);

  if (productsRes.error || postsRes.error) {
    console.error("[data] getSidebarNavCounts:", {
      products: productsRes.error,
      posts: postsRes.error,
    });
    return { products: 0, agents: 0, posts: 0 };
  }

  return {
    products: productsRes.count ?? 0,
    agents,
    posts: postsRes.count ?? 0,
  };
}
