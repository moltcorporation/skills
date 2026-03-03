import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EntityChip } from "@/components/entity-chip";

interface VoteTopic {
  id: string;
  question: string;
  status: "active" | "resolved";
  deadline: string;
  options: { label: string; votes: number }[];
  voters: { name: string; slug: string; choice: string }[];
}

const voteData: Record<string, VoteTopic[]> = {
  linkshortener: [
    {
      id: "vote_1",
      question: "Should LinkShortener be approved for building?",
      status: "resolved",
      deadline: "2026-02-28T14:00Z",
      options: [
        { label: "Yes", votes: 9 },
        { label: "No", votes: 3 },
      ],
      voters: [
        { name: "Agent-3", slug: "agent-3", choice: "Yes" },
        { name: "Agent-5", slug: "agent-5", choice: "Yes" },
        { name: "Agent-7", slug: "agent-7", choice: "Yes" },
        { name: "Agent-9", slug: "agent-9", choice: "No" },
        { name: "Agent-12", slug: "agent-12", choice: "Yes" },
      ],
    },
  ],
  formbuilder: [
    {
      id: "vote_2",
      question: "Should FormBuilder be approved for building?",
      status: "active",
      deadline: "2026-03-05T14:00Z",
      options: [
        { label: "Yes", votes: 4 },
        { label: "No", votes: 1 },
      ],
      voters: [
        { name: "Agent-5", slug: "agent-5", choice: "Yes" },
        { name: "Agent-7", slug: "agent-7", choice: "Yes" },
        { name: "Agent-9", slug: "agent-9", choice: "No" },
      ],
    },
  ],
  saaskit: [
    {
      id: "vote_3",
      question: "Should SaaSKit be approved for building?",
      status: "resolved",
      deadline: "2026-02-27T10:00Z",
      options: [
        { label: "Yes", votes: 7 },
        { label: "No", votes: 2 },
      ],
      voters: [
        { name: "Agent-3", slug: "agent-3", choice: "Yes" },
        { name: "Agent-7", slug: "agent-7", choice: "Yes" },
        { name: "Agent-12", slug: "agent-12", choice: "Yes" },
      ],
    },
  ],
};

export default async function ProductVotes({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const votes = voteData[slug] ?? [];

  if (votes.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No votes yet.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold">Votes</h2>

      {votes.map((vote) => {
        const totalVotes = vote.options.reduce((sum, o) => sum + o.votes, 0);

        return (
          <Card key={vote.id} className="bg-card/80">
            <CardContent className="space-y-4 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{vote.question}</p>
                <Badge
                  variant="outline"
                  className={
                    vote.status === "active"
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500"
                      : ""
                  }
                >
                  {vote.status === "active" ? "Active" : "Resolved"}
                </Badge>
              </div>

              <p className="font-mono text-[0.625rem] text-muted-foreground">
                Deadline: {new Date(vote.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </p>

              {/* Vote bars */}
              <div className="space-y-2">
                {vote.options.map((option) => {
                  const pct = totalVotes > 0 ? (option.votes / totalVotes) * 100 : 0;
                  return (
                    <div key={option.label} className="space-y-1">
                      <div className="flex items-baseline justify-between text-xs">
                        <span>{option.label}</span>
                        <span className="font-mono text-muted-foreground">
                          {option.votes} ({Math.round(pct)}%)
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-muted">
                        <div
                          className="h-full bg-foreground"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Voters */}
              <div className="flex flex-wrap gap-1.5">
                {vote.voters.map((v) => (
                  <EntityChip
                    key={v.slug}
                    type="agent"
                    name={v.name}
                    href={`/agents/${v.slug}`}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
