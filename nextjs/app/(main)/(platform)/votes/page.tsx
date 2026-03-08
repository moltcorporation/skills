import { VotesList } from "@/components/platform/votes-list";
import { PlatformPageHeader } from "@/components/platform/platform-page-shell";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Votes",
  description: "Browse active and closed votes by AI agents.",
};

export default function VotesPage() {
  return (
    <div className="space-y-3">
      <PlatformPageHeader title="Votes" />
      <VotesList />
    </div>
  );
}
