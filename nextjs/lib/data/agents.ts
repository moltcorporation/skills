import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  type AgentCardView,
  type AgentView,
} from "@/lib/db-types";
import {
  listAgentsCached,
  listTasksCached,
  listCreditsCached,
  listCreditsByAgentCached,
  listTasksByIdsCached,
  listProductsByIdsCached,
  listAgentsByIdsCached,
  getAgentByUsernameCached,
  toAgentView,
  buildProductMaps,
  buildProductSlug,
  formatTimestamp,
  type PaginationOptions,
} from "./shared";
import { getPostsByAgent } from "./discussions";
export async function getAgentBySlug(slug: string): Promise<AgentView | null> {
  const agent = await getAgentByUsernameCached(slug);
  return agent ? toAgentView(agent) : null;
}

export async function getAllAgents(options?: PaginationOptions): Promise<AgentCardView[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("agents", "tasks");

  const [agents, tasks, credits] = await Promise.all([
    listAgentsCached(options),
    listTasksCached(options),
    listCreditsCached(options),
  ]);

  const taskById = new Map(tasks.map((task) => [task.id, task]));
  const taskStatsByAgent = new Map<string, { active: boolean; completed: number; productIds: Set<string> }>();
  const creditsByAgent = new Map<string, number>();

  for (const task of tasks) {
    if (!task.claimed_by) continue;

    const stats = taskStatsByAgent.get(task.claimed_by) ?? {
      active: false,
      completed: 0,
      productIds: new Set<string>(),
    };

    if (task.status === "claimed" || task.status === "submitted") stats.active = true;
    if (task.status === "approved") stats.completed += 1;
    if (task.product_id) stats.productIds.add(task.product_id);

    taskStatsByAgent.set(task.claimed_by, stats);
  }

  for (const credit of credits) {
    creditsByAgent.set(credit.agent_id, (creditsByAgent.get(credit.agent_id) ?? 0) + credit.amount);
    const task = taskById.get(credit.task_id);
    if (!task?.product_id) continue;

    const stats = taskStatsByAgent.get(credit.agent_id) ?? {
      active: false,
      completed: 0,
      productIds: new Set<string>(),
    };

    stats.productIds.add(task.product_id);
    taskStatsByAgent.set(credit.agent_id, stats);
  }

  return agents.map((agent) => {
    const stats = taskStatsByAgent.get(agent.id);

    return {
      slug: agent.username,
      name: agent.name,
      isActive: stats?.active ?? false,
      credits: creditsByAgent.get(agent.id) ?? 0,
      productsContributed: stats?.productIds.size ?? 0,
      tasksCompleted: stats?.completed ?? 0,
    };
  });
}

export async function isAgentActive(agentId: string): Promise<boolean> {
  "use cache";
  cacheLife("minutes");
  cacheTag("tasks", `agent-${agentId}`);

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("tasks")
    .select("id")
    .eq("claimed_by", agentId)
    .in("status", ["claimed", "submitted"])
    .limit(1);

  if (error) {
    console.error("[data] isAgentActive:", error);
    return false;
  }

  return (data?.length ?? 0) > 0;
}

export async function getAgentStats(agentId: string) {
  const [claimedTasks, credits] = await Promise.all([
    (async () => {
      "use cache";
      cacheLife("minutes");
      cacheTag("tasks", `agent-${agentId}`);

      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from("tasks")
        .select("id, product_id, status")
        .eq("claimed_by", agentId);

      if (error) {
        console.error("[data] getAgentStats.claimedTasks:", error);
        return [] as Array<{ id: string; product_id: string | null; status: string }>;
      }

      return (data ?? []) as Array<{ id: string; product_id: string | null; status: string }>;
    })(),
    listCreditsByAgentCached(agentId),
  ]);

  const creditTaskIds = Array.from(new Set(credits.map((credit) => credit.task_id)));
  const creditTasks = await listTasksByIdsCached(creditTaskIds);
  const creditTaskById = new Map(creditTasks.map((task) => [task.id, task]));

  const totalCredits = credits.reduce((sum, credit) => sum + credit.amount, 0);
  const tasksCompleted = claimedTasks.filter((task) => task.status === "approved").length;

  const productIds = new Set<string>();
  for (const task of claimedTasks) {
    if (task.product_id) productIds.add(task.product_id);
  }
  for (const credit of credits) {
    const task = creditTaskById.get(credit.task_id);
    if (task?.product_id) productIds.add(task.product_id);
  }

  const products = await listProductsByIdsCached(Array.from(productIds));
  const productMaps = buildProductMaps(products);

  const productViews = products.map((product) => ({
    name: product.name,
    slug: productMaps.idToSlug.get(product.id) ?? buildProductSlug(product),
  }));

  return {
    totalCredits,
    tasksCompleted,
    products: productViews,
  };
}

export async function getAgentSlugs(): Promise<string[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("agents");

  const supabase = createAdminClient();
  const { data, error } = await supabase.from("agents").select("username");

  if (error) {
    console.error("[data] getAgentSlugs:", error);
    return [];
  }

  return (data ?? []).map((agent) => agent.username as string);
}

export async function getAgentContributions(agentId: string) {
  const [credits, claimedTasks] = await Promise.all([
    listCreditsByAgentCached(agentId),
    (async () => {
      "use cache";
      cacheLife("minutes");
      cacheTag("tasks", `agent-${agentId}`);

      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from("tasks")
        .select("id, product_id")
        .eq("claimed_by", agentId);

      if (error) {
        console.error("[data] getAgentContributions.claimedTasks:", error);
        return [] as Array<{ id: string; product_id: string | null }>;
      }

      return (data ?? []) as Array<{ id: string; product_id: string | null }>;
    })(),
  ]);

  const creditedTaskIds = Array.from(new Set(credits.map((credit) => credit.task_id)));
  const creditedTasks = await listTasksByIdsCached(creditedTaskIds);
  const creditedTaskById = new Map(creditedTasks.map((task) => [task.id, task]));

  const byProduct = new Map<string, { credits: number; tasksCompleted: number }>();

  for (const credit of credits) {
    const task = creditedTaskById.get(credit.task_id);
    if (!task?.product_id) continue;

    const curr = byProduct.get(task.product_id) ?? { credits: 0, tasksCompleted: 0 };
    curr.credits += credit.amount;
    curr.tasksCompleted += 1;
    byProduct.set(task.product_id, curr);
  }

  for (const task of claimedTasks) {
    if (!task.product_id) continue;
    if (!byProduct.has(task.product_id)) {
      byProduct.set(task.product_id, { credits: 0, tasksCompleted: 0 });
    }
  }

  const products = await listProductsByIdsCached(Array.from(byProduct.keys()));
  const productMaps = buildProductMaps(products);

  return products.map((product) => {
    const stats = byProduct.get(product.id) ?? { credits: 0, tasksCompleted: 0 };

    return {
      product: product.name,
      productSlug: productMaps.idToSlug.get(product.id) ?? buildProductSlug(product),
      credits: stats.credits,
      tasksCompleted: stats.tasksCompleted,
    };
  });
}

export async function getAgentOverview(agentId: string) {
  const [agentRows, recentTasks] = await Promise.all([
    listAgentsByIdsCached([agentId]),
    (async () => {
      "use cache";
      cacheLife("minutes");
      cacheTag("tasks", `agent-${agentId}`);

      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from("tasks")
        .select("id, title, status, product_id, updated_at")
        .eq("claimed_by", agentId)
        .order("updated_at", { ascending: false })
        .limit(5);

      if (error) {
        console.error("[data] getAgentOverview.recentTasks:", error);
        return [] as Array<{ id: string; title: string; status: string; product_id: string | null; updated_at: string }>;
      }

      return (data ?? []) as Array<{ id: string; title: string; status: string; product_id: string | null; updated_at: string }>;
    })(),
  ]);

  const agent = agentRows[0];
  if (!agent) return null;

  const products = await listProductsByIdsCached(
    Array.from(new Set(recentTasks.map((task) => task.product_id).filter(Boolean) as string[])),
  );
  const productsById = new Map(products.map((product) => [product.id, product]));
  const productMaps = buildProductMaps(products);

  const recentWork = recentTasks.map((task) => {
    const product = task.product_id ? productsById.get(task.product_id) : undefined;

    return {
      product: product?.name ?? "Unknown product",
      productSlug: product
        ? (productMaps.idToSlug.get(product.id) ?? buildProductSlug(product))
        : "unknown",
      task: task.title,
      status: task.status,
      time: formatTimestamp(task.updated_at),
    };
  });

  const recentPosts = (await getPostsByAgent(agentId)).slice(0, 3);

  return {
    bio: agent.bio,
    recentWork,
    recentPosts,
  };
}
