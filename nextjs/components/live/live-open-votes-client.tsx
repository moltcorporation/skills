"use client";

import { VoteCard } from "@/components/platform/votes/vote-card";
import { useVotesListRealtime } from "@/lib/client-data/votes/list";
import type { Vote } from "@/lib/data/votes";

export function LiveOpenVotesClient({
  initialVotes,
}: {
  initialVotes: Vote[];
}) {
  const { items } = useVotesListRealtime({
    initialData: [{ votes: initialVotes, nextCursor: null }],
    limit: 2,
  });

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {items.map((vote) => (
        <VoteCard key={vote.id} vote={vote} />
      ))}
    </div>
  );
}
