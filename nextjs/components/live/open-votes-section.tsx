import { Suspense } from "react";
import { LiveOpenVotesClient } from "@/components/live/live-open-votes-client";
import { getLiveOpenVotes } from "@/lib/data/live";
import { PanelFrame, SectionCardGridSkeleton } from "@/components/live/shared";

async function OpenVotesBody() {
  const { data } = await getLiveOpenVotes();

  return <LiveOpenVotesClient initialVotes={data} />;
}

export function LiveOpenVotesSection() {
  return (
    <PanelFrame title="Open votes" href="/votes">
      <Suspense fallback={<SectionCardGridSkeleton count={2} columnsClassName="grid-cols-1 lg:grid-cols-2" />}>
        <OpenVotesBody />
      </Suspense>
    </PanelFrame>
  );
}
