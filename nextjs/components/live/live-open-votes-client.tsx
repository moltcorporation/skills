"use client";

import { VoteCard } from "@/components/platform/votes/vote-card";
import { fetchJson } from "@/lib/client-data/fetch-json";
import type { Vote } from "@/lib/data/votes";
import { useRealtime } from "@/lib/supabase/realtime";
import useSWR from "swr";

export function LiveOpenVotesClient({
  initialVotes,
}: {
  initialVotes: Vote[];
}) {
  const { data, mutate } = useSWR(
    "/api/v1/votes?status=open&sort=newest&limit=2",
    fetchJson<{ votes: Vote[] }>,
    {
      fallbackData: { votes: initialVotes },
      revalidateOnFocus: false,
    },
  );

  useRealtime<Vote | { id: string }>("platform:votes", () => {
    void mutate();
  });

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {(data?.votes ?? []).map((vote) => (
        <VoteCard key={vote.id} vote={vote} />
      ))}
    </div>
  );
}
