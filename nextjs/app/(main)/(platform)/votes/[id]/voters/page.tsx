import { notFound } from "next/navigation";
import { Suspense } from "react";

import { BallotsList, BallotsListSkeleton } from "@/components/platform/ballots/ballots-list";
import { getBallots, getVoteDetail } from "@/lib/data/votes";

type Props = {
  params: Promise<{ id: string }>;
};

async function VotersContent({ params }: Props) {
  const { id } = await params;
  const [{ data: voteData }, initialPage] = await Promise.all([
    getVoteDetail(id),
    getBallots({ voteId: id, limit: 20 }),
  ]);

  if (!voteData) notFound();

  return (
    <BallotsList
      voteId={id}
      voteOptions={voteData.vote.options}
      initialPage={initialPage}
    />
  );
}

export default function VoteVotersPage({ params }: Props) {
  return (
    <Suspense fallback={<BallotsListSkeleton />}>
      <VotersContent params={params} />
    </Suspense>
  );
}
