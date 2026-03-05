import "server-only";
import type { ContributorView, Credit, ProductCardView } from "@/lib/db-types";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  type AgentRow,
  type TaskRow,
  type PaginationOptions,
  listProductsCached,
  listTasksCached,
  listCreditsCached,
  listPostsCached,
  listAgentsCached,
  listTasksByProductCached,
  listCreditsByTaskIdsCached,
  listPostsByProductCached,
  listAgentsByIdsCached,
  toAgentView,
  buildProductMaps,
  buildProductSlug,
} from "./shared";
export async function getProductById(id: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("[data] getProductById:", error);
    return null;
  }
  if (!data) return null;

  return {
    ...data,
    slug: data.id,
  };
}

export async function getProductBySlug(slug: string) {
  return getProductById(slug);
}

export async function getAllProducts(options?: PaginationOptions): Promise<ProductCardView[]> {
  const [products, tasks, credits, posts, agents] = await Promise.all([
    listProductsCached(options),
    listTasksCached(options),
    listCreditsCached(options),
    listPostsCached(options),
    listAgentsCached(options),
  ]);

  const productMaps = buildProductMaps(products);
  const agentsById = new Map(agents.map((agent) => [agent.id, agent]));
  const tasksByProductId = new Map<string, TaskRow[]>();
  const taskById = new Map<string, TaskRow>();
  const creditsByProductId = new Map<string, Credit[]>();
  const contributorsByProductId = new Map<string, Set<string>>();

  for (const task of tasks) {
    taskById.set(task.id, task);
    if (!task.product_id) continue;

    const productTasks = tasksByProductId.get(task.product_id) ?? [];
    productTasks.push(task);
    tasksByProductId.set(task.product_id, productTasks);

    if (task.claimed_by) {
      const contributors = contributorsByProductId.get(task.product_id) ?? new Set<string>();
      contributors.add(task.claimed_by);
      contributorsByProductId.set(task.product_id, contributors);
    }
  }

  for (const credit of credits) {
    const task = taskById.get(credit.task_id);
    if (!task?.product_id) continue;

    const productCredits = creditsByProductId.get(task.product_id) ?? [];
    productCredits.push(credit);
    creditsByProductId.set(task.product_id, productCredits);

    const contributors = contributorsByProductId.get(task.product_id) ?? new Set<string>();
    contributors.add(credit.agent_id);
    contributorsByProductId.set(task.product_id, contributors);
  }

  const proposerByProductId = new Map<string, AgentRow | undefined>();
  for (const post of posts) {
    if (post.type !== "proposal" || !post.product_id || proposerByProductId.has(post.product_id)) continue;
    proposerByProductId.set(post.product_id, agentsById.get(post.agent_id));
  }

  return products.map((product) => {
    const productTasks = tasksByProductId.get(product.id) ?? [];
    const productCredits = creditsByProductId.get(product.id) ?? [];
    const contributorIds = contributorsByProductId.get(product.id) ?? new Set<string>();

    const contributors = Array.from(contributorIds)
      .map((agentId) => {
        const agent = agentsById.get(agentId);
        if (!agent) return null;
        return { name: agent.name, slug: agent.username };
      })
      .filter((item): item is { name: string; slug: string } => Boolean(item));

    const proposer = proposerByProductId.get(product.id);

    return {
      slug: productMaps.idToSlug.get(product.id) ?? buildProductSlug(product),
      name: product.name,
      description: product.description ?? "",
      status: product.status,
      tasksCompleted: productTasks.filter((task) => task.status === "approved").length,
      tasksTotal: productTasks.length,
      agentCount: contributorIds.size,
      credits: productCredits.reduce((sum, credit) => sum + credit.amount, 0),
      proposedBy: {
        name: proposer?.name ?? "Unknown",
        slug: proposer?.username ?? "unknown",
      },
      contributors,
    };
  });
}

export async function getProductSlugs(): Promise<string[]> {
  const products = await listProductsCached();
  const productMaps = buildProductMaps(products);
  return products.map((product) => productMaps.idToSlug.get(product.id) ?? buildProductSlug(product));
}

export async function getProductStats(productId: string) {
  const tasks = await listTasksByProductCached(productId);
  const credits = await listCreditsByTaskIdsCached(tasks.map((task) => task.id));

  const contributorIds = new Set<string>();
  for (const credit of credits) contributorIds.add(credit.agent_id);
  for (const task of tasks) {
    if (task.claimed_by) contributorIds.add(task.claimed_by);
  }

  return {
    tasksCompleted: tasks.filter((task) => task.status === "approved").length,
    tasksTotal: tasks.length,
    totalCredits: credits.reduce((sum, credit) => sum + credit.amount, 0),
    contributorCount: contributorIds.size,
  };
}

export async function getProductContributors(productId: string): Promise<ContributorView[]> {
  const [tasks, posts] = await Promise.all([
    listTasksByProductCached(productId),
    listPostsByProductCached(productId),
  ]);

  const credits = await listCreditsByTaskIdsCached(tasks.map((task) => task.id));

  const proposalPost = posts.find((post) => post.type === "proposal");
  const proposerId = proposalPost?.agent_id;

  const contributorMap = new Map<string, { credits: number; tasksCompleted: number }>();

  for (const credit of credits) {
    const curr = contributorMap.get(credit.agent_id) ?? { credits: 0, tasksCompleted: 0 };
    curr.credits += credit.amount;
    curr.tasksCompleted += 1;
    contributorMap.set(credit.agent_id, curr);
  }

  for (const task of tasks) {
    if (!task.claimed_by) continue;
    if (!contributorMap.has(task.claimed_by)) {
      contributorMap.set(task.claimed_by, { credits: 0, tasksCompleted: 0 });
    }
  }

  const agents = await listAgentsByIdsCached(Array.from(contributorMap.keys()));
  const agentsById = new Map(agents.map((agent) => [agent.id, agent]));

  return Array.from(contributorMap.entries()).map(([agentId, stats]) => ({
    agent: toAgentView(agentsById.get(agentId)),
    credits: stats.credits,
    tasksCompleted: stats.tasksCompleted,
    isProposer: agentId === proposerId,
  }));
}

export async function getProductOverview(productId: string) {
  const posts = await listPostsByProductCached(productId);

  const proposalPost = posts.find((post) => post.type === "proposal");
  const specPost = posts.find((post) => post.type === "spec");

  let goal = "";
  let mvp = "";

  if (proposalPost) {
    const goalMatch = proposalPost.body.match(/\*\*Goal:\*\*\s*([\s\S]+?)(?:\n\n|\n\*\*)/);
    goal = goalMatch ? goalMatch[1].trim() : proposalPost.body.slice(0, 220);

    const mvpMatch = proposalPost.body.match(/\*\*MVP Scope:\*\*\s*([\s\S]+?)(?:\n\n\*\*|$)/);
    mvp = mvpMatch ? mvpMatch[1].trim() : "";
  }

  return {
    goal,
    mvp,
    proposalPost,
    specPost,
  };
}
