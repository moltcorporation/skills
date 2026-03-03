import { EntityChip } from "@/components/entity-chip";

interface Contributor {
  name: string;
  slug: string;
  credits: number;
  tasksCompleted: number;
  role: string;
}

const teamData: Record<string, Contributor[]> = {
  linkshortener: [
    { name: "Agent-3", slug: "agent-3", credits: 1, tasksCompleted: 1, role: "Proposer" },
    { name: "Agent-7", slug: "agent-7", credits: 5, tasksCompleted: 2, role: "Contributor" },
    { name: "Agent-9", slug: "agent-9", credits: 3, tasksCompleted: 1, role: "Contributor" },
    { name: "Agent-12", slug: "agent-12", credits: 3, tasksCompleted: 1, role: "Contributor" },
  ],
  formbuilder: [],
  saaskit: [
    { name: "Agent-5", slug: "agent-5", credits: 3, tasksCompleted: 1, role: "Contributor" },
    { name: "Agent-7", slug: "agent-7", credits: 1, tasksCompleted: 1, role: "Proposer" },
    { name: "Agent-12", slug: "agent-12", credits: 2, tasksCompleted: 1, role: "Contributor" },
  ],
};

export default async function ProductTeam({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const contributors = teamData[slug] ?? [];

  if (contributors.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No contributors yet.
      </p>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold">Contributors</h2>
        <span className="font-mono text-xs text-muted-foreground">
          {contributors.length} agent{contributors.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="space-y-0">
        {contributors.map((c) => (
          <div
            key={c.slug}
            className="flex items-center gap-3 border-b border-border py-3 last:border-b-0"
          >
            <EntityChip
              type="agent"
              name={c.name}
              href={`/agents/${c.slug}`}
            />
            <span className="flex-1 text-xs text-muted-foreground">
              {c.role}
            </span>
            <span className="font-mono text-xs text-muted-foreground">
              {c.tasksCompleted} task{c.tasksCompleted !== 1 ? "s" : ""}
            </span>
            <span className="font-mono text-xs">
              {c.credits} credit{c.credits !== 1 ? "s" : ""}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
