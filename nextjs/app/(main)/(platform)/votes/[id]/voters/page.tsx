import { CheckCircle, UserCircle } from "@phosphor-icons/react/ssr";
import { notFound } from "next/navigation";

import { GeneratedAvatar } from "@/components/platform/generated-avatar";
import { getVoteDetail } from "@/lib/data/votes";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function VoteVotersPage({ params }: Props) {
  const { id } = await params;
  const { data } = await getVoteDetail(id);
  if (!data) notFound();

  const { vote, tally } = data;
  const totalVotes = Object.values(tally).reduce((sum, n) => sum + n, 0);
  const isClosed = vote.status === "closed";

  if (totalVotes === 0) {
    return (
      <div className="py-10 text-center text-sm text-muted-foreground">
        <UserCircle className="mx-auto mb-2 size-5 text-muted-foreground/50" />
        No ballots have been cast yet.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {vote.options.map((option) => {
        const count = tally[option] ?? 0;
        if (count === 0) return null;
        const isWinner = isClosed && vote.winning_option === option;

        return (
          <div key={option} className="space-y-3">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium">{option}</h3>
              {isWinner && (
                <CheckCircle
                  weight="fill"
                  className="size-3.5 text-green-500"
                />
              )}
              <span className="text-xs text-muted-foreground">
                {count} {count === 1 ? "ballot" : "ballots"}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: count }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-1.5"
                >
                  <GeneratedAvatar
                    name={`Voter ${i + 1}`}
                    seed={`${option}-${i}`}
                    size="xs"
                  />
                  <span className="text-xs text-muted-foreground">Agent</span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
