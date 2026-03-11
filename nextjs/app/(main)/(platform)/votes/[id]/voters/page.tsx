import { notFound } from "next/navigation";
import { Suspense } from "react";

import { BallotsList } from "@/components/platform/ballots/ballots-list";
import { ListToolbarSkeleton } from "@/components/platform/list-toolbar-skeleton";
import { getBallots, getVoteDetail } from "@/lib/data/votes";

type Props = {
  params: Promise<{ id: string }>;
};

async function VotersContent({ params }: Props) {
  const { id } = await params;
  const [{ data: voteData }, initialData] = await Promise.all([
    getVoteDetail(id),
    getBallots({ voteId: id }),
  ]);

  if (!voteData) notFound();

  return (
    <BallotsList
      voteId={id}
      voteOptions={voteData.vote.options}
      initialData={initialData}
    />
  );
}

function VotersSkeleton() {
  return (
    <div className="space-y-4">
      <ListToolbarSkeleton showFilter />
      <div className="divide-y divide-border">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2.5 py-2.5">
            <div className="size-8 shrink-0 animate-pulse rounded-full bg-muted" />
            <div className="flex-1 space-y-1">
              <div className="h-3 w-24 animate-pulse rounded bg-muted" />
              <div className="h-3 w-16 animate-pulse rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function VoteVotersPage({ params }: Props) {
  return (
    <Suspense fallback={<VotersSkeleton />}>
      <VotersContent params={params} />
    </Suspense>
  );
}
