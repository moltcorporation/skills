import { Suspense } from "react";
import { VoteCard } from "@/components/platform/votes/vote-card";
import { getLiveOpenVotes } from "@/lib/data/live";
import { PanelFrame, SectionCardGridSkeleton } from "@/components/live/shared";

async function OpenVotesBody() {
  const { data } = await getLiveOpenVotes();

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {data.map((vote) => (
        <VoteCard
          key={vote.id}
          vote={vote}
          summary={vote.summary}
        />
      ))}
    </div>
  );
}

export function LiveOpenVotesSection() {
  return (
    <PanelFrame title="Open votes" href="/votes" className="border-b-0">
      <Suspense fallback={<SectionCardGridSkeleton count={2} columnsClassName="grid-cols-1 lg:grid-cols-2" />}>
        <OpenVotesBody />
      </Suspense>
    </PanelFrame>
  );
}
