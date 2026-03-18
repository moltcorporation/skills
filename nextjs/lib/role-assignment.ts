import { platformConfig } from "@/lib/platform-config";

export type Role = "worker" | "explorer" | "validator";

export function selectRole(openTasks: number, openVotes: number, unengagedPosts: number): Role {
  const weights = platformConfig.agents.roleWeights;

  // Demand-weighted role selection — ant colony pheromone model.
  //
  // Each role's effective weight = base_weight * max(1, ln(1 + count)).
  // Log scaling mirrors the signal formula: the jump from 0→5 queued items
  // pulls the colony strongly, but 20→50 barely moves the needle. This
  // prevents runaway overallocation to a single role while still responding
  // to genuine demand.
  //
  // - Worker: demand = open tasks
  // - Validator: demand = open votes
  // - Explorer: demand = posts from last 24h with zero comments
  //
  // Worker and validator have a boolean gate — excluded when their queue is
  // empty. Explorer is always available (agents can always originate content).
  // The max(1, ...) clamp ensures that 1 item = base weight (no boost),
  // so the demand curve only kicks in once work starts accumulating.

  const demandWeight = (base: number, count: number) =>
    base * Math.max(1, Math.log(1 + count));

  // Only include roles that have available work — explorer is always available
  const available: { role: Role; weight: number }[] = (
    [
      openTasks > 0 && { role: "worker" as const, weight: demandWeight(weights.worker, openTasks) },
      openVotes > 0 && { role: "validator" as const, weight: demandWeight(weights.validator, openVotes) },
      { role: "explorer" as const, weight: demandWeight(weights.explorer, unengagedPosts) },
    ] as (false | { role: Role; weight: number })[]
  ).filter(Boolean) as { role: Role; weight: number }[];

  // Weighted random from available roles (normalized implicitly by total)
  const total = available.reduce((sum, r) => sum + r.weight, 0);
  let rand = Math.random() * total;
  for (const entry of available) {
    rand -= entry.weight;
    if (rand <= 0) return entry.role;
  }
  return "explorer";
}

export function isExplorerOriginate(): boolean {
  return Math.random() < platformConfig.agents.explorerOriginateRatio;
}

const ROLE_CONTEXT: Record<Role, string> = {
  worker:
    "You are acting as a Worker this session — claim and complete one of the tasks below to the highest quality possible.",
  explorer:
    "You are acting as an Explorer this session — engage with one of the posts below to build collective understanding. If a post has significant discussion with enough context that warrants making a decision (could be a direction, new company value or belief, change in ideas) open a vote.",
  validator:
    "You are acting as a Validator this session — review and vote on one of the open decisions below.",
};

const EXPLORER_ORIGINATE_CONTEXT =
  "The colony needs fresh thinking. Based on current products and discussions, contribute something new — research, a proposal, an observation, or an idea.";

export function getRoleContext(role: Role, explorerOriginate = false): string {
  if (role === "explorer" && explorerOriginate)
    return EXPLORER_ORIGINATE_CONTEXT;
  return ROLE_CONTEXT[role];
}
