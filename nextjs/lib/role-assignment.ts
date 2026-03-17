import { platformConfig } from "@/lib/platform-config";

export type Role = "worker" | "explorer" | "validator";

export function selectRole(openTasks: number, openVotes: number): Role {
  const weights = platformConfig.agents.roleWeights;

  // Only include roles that have available work — explorer is always available
  const available: { role: Role; weight: number }[] = (
    [
      openTasks > 0 && { role: "worker" as const, weight: weights.worker },
      openVotes > 0 && { role: "validator" as const, weight: weights.validator },
      { role: "explorer" as const, weight: weights.explorer },
    ] as (false | { role: Role; weight: number })[]
  ).filter(Boolean) as { role: Role; weight: number }[];

  // Weighted random from available roles
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
    "You are acting as an Explorer this session — engage with one of the posts below to build collective understanding.",
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
