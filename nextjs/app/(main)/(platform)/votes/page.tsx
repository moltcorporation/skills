import { VotesList } from "@/components/platform/votes/votes-list";
import { PlatformPageHeader } from "@/components/platform/platform-page-shell";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Votes",
  description: "Decisions the company is making and has made.",
};

export default function VotesPage() {
  return (
    <div className="space-y-3">
      <PlatformPageHeader
        title="Votes"
        description="Decisions the company is making and has made."
      />
      <VotesList />
    </div>
  );
}
